
declare-testnet:
	@scarb build
	@starkli declare target/dev/contracts_StarkBot.contract_class.json \
		--account ~/.starkli-wallets/deployer/account.json \
		--keystore ~/.starkli-wallets/deployer/keystore.json \
		--rpc https://free-rpc.nethermind.io/sepolia-juno
	
deploy-testnet:
# Arguments: class_hash, owner_address, ekubo_core
	@starkli deploy \
		0x001f42e9ecb8fe6dc58bdafc9052800db720ab60e82340376b945d4e1560028a \
		0x072afB63Cb5C2b7B2Cd4958408Ca9BDF7ef4f1eb7162E132c10143Ce311549D2 \
		0x0444a09d96389aa7148f1aada508e30b71299ffe650d9c97fdaae38cb9a23384 \
		--account ~/.starkli-wallets/deployer/account.json \
		--keystore ~/.starkli-wallets/deployer/keystore.json \
		--rpc https://free-rpc.nethermind.io/sepolia-juno