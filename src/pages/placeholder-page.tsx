type PlaceholderPageProps = {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-2xl font-bold text-foreground">{title}</h1>
      <p className="text-aco-texto">{description}</p>

      <div className="mt-6 rounded-lg border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
        Em construção — esta tela será implementada nas próximas fases.
      </div>
    </div>
  )
}
