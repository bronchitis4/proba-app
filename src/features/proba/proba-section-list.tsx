import { Check } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { ProbaState, RequirementState } from '@/types/api'

const dateFmt = new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })

interface ProbaSectionListProps {
  proba: ProbaState
  canEdit: boolean
  onToggle: (requirementId: string, completed: boolean) => void
}

function sectionCounts(reqs: RequirementState[]) {
  const required = reqs.filter((r) => !r.isOptional)
  const done = required.filter((r) => r.completed).length
  return { done, total: required.length, complete: done === required.length }
}

export function ProbaSectionList({ proba, canEdit, onToggle }: ProbaSectionListProps) {
  const firstIncomplete = proba.sections.find((s) => !sectionCounts(s.requirements).complete)
  const defaultOpen =
    proba.sections.length === 1 ? [proba.sections[0].id] : firstIncomplete ? [firstIncomplete.id] : []

  return (
    <Accordion type="multiple" defaultValue={defaultOpen}>
      {proba.sections.map((section) => {
        const { done, total, complete } = sectionCounts(section.requirements)
        return (
          <AccordionItem key={section.id} value={section.id}>
            <AccordionTrigger className="items-center gap-3">
              <span className="flex min-w-0 flex-1 items-baseline gap-2">
                <span className="font-semibold">{section.letter}</span>
                <span className="truncate">{section.title}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                {complete && (
                  <Badge variant="secondary" aria-label="Розділ виконано">
                    <Check />
                  </Badge>
                )}
                <span className="text-xs tabular-nums text-muted-foreground">
                  {done}/{total}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="flex flex-col gap-3">
                {section.requirements.map((r) => {
                  const id = `req-${r.id}`
                  return (
                    <li key={r.id} className="flex items-start gap-3">
                      <Checkbox
                        id={id}
                        className="mt-0.5"
                        checked={r.completed}
                        disabled={!canEdit}
                        onCheckedChange={(v) => onToggle(r.id, v === true)}
                      />
                      <div className="flex min-w-0 flex-col gap-1">
                        <Label
                          htmlFor={id}
                          className={cn('block leading-snug font-normal', r.completed && 'text-muted-foreground')}
                        >
                          <span className="mr-1.5 tabular-nums text-muted-foreground">{r.number}.</span>
                          {r.text}
                        </Label>
                        {(r.isOptional || r.completed) && (
                          <div className="flex flex-wrap items-center gap-2">
                            {r.isOptional && <Badge variant="outline">за бажанням</Badge>}
                            {r.completed && r.completedAt && (
                              <span className="text-xs text-muted-foreground">
                                Відмічено {dateFmt.format(new Date(r.completedAt))}
                                {r.completedBy && ` · ${r.completedBy.name}`}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
