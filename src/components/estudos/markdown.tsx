// Editor/visualizador markdown (@uiw/react-md-editor, build "common": realce de
// sintaxe só das linguagens comuns). Carregado sob demanda via React.lazy.
import MDEditor from '@uiw/react-md-editor/common'

type EditorProps = { value: string; onChange: (valor: string) => void; altura?: number; id?: string }

export default function MarkdownEditor({ value, onChange, altura = 320, id }: EditorProps) {
  return (
    <div data-color-mode="dark" className="estudos-md">
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? '')}
        height={altura}
        preview="edit"
        visibleDragbar={false}
        textareaProps={{ id, placeholder: 'Escreva em markdown: **negrito**, _itálico_, listas, `código`, tabelas…' }}
      />
    </div>
  )
}

export function MarkdownView({ texto }: { texto: string }) {
  return (
    <div data-color-mode="dark" className="estudos-md">
      <MDEditor.Markdown source={texto} />
    </div>
  )
}
