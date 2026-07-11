import { Button, Card, CardBody, Tooltip } from '@heroui/react'
import type { Scenario } from '@shared/types'

interface ScenariosPanelProps {
  scenarios: Scenario[]
  runningId: string | null
  onRun: (scenario: Scenario) => void
}

export function ScenariosPanel({ scenarios, runningId, onRun }: ScenariosPanelProps): JSX.Element | null {
  if (scenarios.length === 0) return null

  return (
    <Card radius="lg" shadow="sm" className="border border-default-100/80">
      <CardBody className="flex flex-row flex-wrap gap-2">
        {scenarios.map((scenario) => (
          <Tooltip key={scenario.id} content={scenario.is_active === false ? '⏸' : undefined} isDisabled={scenario.is_active !== false}>
            <Button
              variant="flat"
              color="secondary"
              className={scenario.is_active === false ? 'opacity-60' : undefined}
              isLoading={runningId === scenario.id}
              onPress={() => onRun(scenario)}
            >
              {scenario.icon ? `${scenario.icon} ` : ''}
              {scenario.name}
            </Button>
          </Tooltip>
        ))}
      </CardBody>
    </Card>
  )
}
