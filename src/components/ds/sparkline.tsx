import { Line, LineChart } from 'recharts'

type SparklineProps = {
  data: number[]
  width?: number
  height?: number
  color?: string
  className?: string
  /** Descrição para leitores de tela (ex.: "Peso nas últimas 8 pesagens"). */
  label?: string
}

/** Mini gráfico de linha sem eixos, grade nem tooltip — com o último ponto destacado. */
export function Sparkline({ data, width = 80, height = 32, color = 'var(--brasa)', className, label }: SparklineProps) {
  if (data.length < 2) return null
  const pontos = data.map((v, i) => ({ i, v }))
  const ultimo = pontos.length - 1

  return (
    <div className={className} role="img" aria-label={label ?? 'Tendência'} style={{ width, height }}>
      <LineChart width={width} height={height} data={pontos} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          isAnimationActive={false}
          dot={(props: { cx?: number; cy?: number; index?: number }) =>
            props.index === ultimo && props.cx != null && props.cy != null ? (
              <circle key="fim" cx={props.cx} cy={props.cy} r={4} fill={color} stroke="var(--fundo)" strokeWidth={1.5} />
            ) : (
              <g key={`p${props.index}`} />
            )
          }
        />
      </LineChart>
    </div>
  )
}
