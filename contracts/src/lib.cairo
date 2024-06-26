#[starknet::contract]
mod StarkBot {
    use openzeppelin::token::erc20::erc20::ERC20Component::InternalTrait;
    use core::option::OptionTrait;
    use core::traits::TryInto;
    use openzeppelin::access::ownable::interface::OwnableABI;
    use ekubo::components::clear::IClear;
    use core::traits::Into;
    use ekubo::types::i129::i129Trait;
    use ekubo::interfaces::core::ICoreDispatcherTrait;
    use openzeppelin::token::erc20::ERC20Component;
    use openzeppelin::access::ownable::OwnableComponent;

    use ekubo::interfaces::core::{ICoreDispatcher, ILocker, SwapParameters};
    use ekubo::interfaces::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use ekubo::types::keys::{PoolKey};
    use ekubo::types::i129::{i129};
    use ekubo::types::delta::{Delta};
    use ekubo::components::shared_locker::{
        call_core_with_callback, consume_callback_data, handle_delta
    };

    use starknet::{ContractAddress, get_caller_address, get_contract_address};

    use core::array::ArrayTrait;
    use core::array::SpanTrait;

    const DECIMALS_MULTIPLIER: u256 = 1000000000000000000;
    const SWAP_FEE: u256 = 500 * DECIMALS_MULTIPLIER;


    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;


    #[storage]
    struct Storage {
        core: ICoreDispatcher,
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        OwnableEvent: OwnableComponent::Event
    }


    #[derive(Copy, Drop, Serde)]
    struct SwapData {
        pool_key: PoolKey,
        params: SwapParameters,
    }

    #[derive(Copy, Drop, Serde)]
    struct CallbackData {
        swap_data: SwapData,
        recipient: ContractAddress,
    }

    #[derive(Copy, Drop, Serde)]
    struct SwapResult {
        delta: Delta,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, ekubo_core: ContractAddress) {
        let name = "StarkBot";
        let symbol = "STRKBOT";

        self.ownable.initializer(owner);
        self.erc20.initializer(name, symbol);
        self.core.write(ICoreDispatcher { contract_address: ekubo_core });

        self.erc20._mint(owner, 100000000000000000000000000);
    }

    // Initiate a swap through Ekubo, with STARKBOT fees charged
    #[external(v0)]
    fn swap(ref self: ContractState, swap_data: SwapData) -> SwapResult {
        let balance = self.erc20.balance_of(get_caller_address());
        assert(balance > SWAP_FEE, 'Insufficient balance');
        self.erc20._transfer(get_caller_address(), get_contract_address(), SWAP_FEE);

        let input_token_address = if swap_data.params.is_token1 {
            swap_data.pool_key.token1
        } else {
            swap_data.pool_key.token0
        };

        let input_token = IERC20Dispatcher { contract_address: input_token_address };
        input_token
            .transferFrom(
                get_caller_address(), get_contract_address(), swap_data.params.amount.mag.into()
            );

        call_core_with_callback(
            self.core.read(), @CallbackData { swap_data, recipient: get_caller_address() }
        )
    }

    // Ekubo locker swap callback
    #[abi(embed_v0)]
    impl Locker of ILocker<ContractState> {
        fn locked(ref self: ContractState, id: u32, data: Span<felt252>) -> Span<felt252> {
            let core = self.core.read();

            let callback_data: CallbackData = consume_callback_data(core, data);
            let swap_data = callback_data.swap_data;

            let balance_delta = core.swap(swap_data.pool_key, swap_data.params);

            // Handle Deltas
            handle_delta(
                core, swap_data.pool_key.token0, balance_delta.amount0, callback_data.recipient
            );
            handle_delta(
                core, swap_data.pool_key.token1, balance_delta.amount1, callback_data.recipient
            );

            let swap_result = SwapResult { delta: balance_delta };
            let mut arr: Array<felt252> = ArrayTrait::new();
            Serde::serialize(@swap_result, ref arr);
            arr.span()
        }
    }

    // Helper function used for local testing to mint an arbitrary amount of tokens
    #[external(v0)]
    fn mint(ref self: ContractState, to: ContractAddress, amount: u256) {
        self.erc20._mint(to, amount);
    }

    // Withdraw earned fees to the owner
    #[external(v0)]
    fn withdraw(ref self: ContractState, amount: u256) {
        self.ownable.assert_only_owner();
        self.erc20.transfer(self.owner(), amount);
    }

    // Read-only functions
    #[external(v0)]
    fn owner(self: @ContractState) -> ContractAddress {
        self.ownable.owner()
    }

    #[external(v0)]
    fn core_dispatcher(self: @ContractState) -> ContractAddress {
        self.core.read().contract_address
    }
}
