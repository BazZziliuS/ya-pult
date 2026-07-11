import { Card, CardBody, CardHeader, Skeleton } from '@heroui/react'

export function HomeSkeleton(): JSX.Element {
  return (
    <div>
      <Skeleton className="h-6 w-40 rounded-lg mb-3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} radius="lg" shadow="sm" className="border border-default-100/80">
            <CardHeader>
              <Skeleton className="h-4 w-24 rounded-lg" />
            </CardHeader>
            <CardBody className="gap-3">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </CardBody>
          </Card>
        ))}
      </div>
      <Skeleton className="h-6 w-32 rounded-lg mb-3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} radius="lg" shadow="sm" className="border border-default-100/80">
            <CardHeader>
              <Skeleton className="h-4 w-32 rounded-lg" />
            </CardHeader>
            <CardBody className="gap-3">
              <Skeleton className="h-6 w-full rounded-lg" />
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
