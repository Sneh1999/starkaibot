'use client'

import { useState, useRef, useEffect, useId } from 'react'
import { scaleLinear } from 'd3-scale'
import { subMonths, format } from 'date-fns'
import { useResizeObserver } from 'usehooks-ts'
import { useAIState } from 'ai/rsc'

interface SwapProps {
  tokenTo: string
  tokenFrom: string
}

export function Swap({ props: { tokenFrom, tokenTo } }: { props: SwapProps }) {
  return (
    <div className="rounded-xl border bg-zinc-950 p-4 text-green-400">
      Hello {tokenTo} {tokenFrom}
    </div>
  )
}
