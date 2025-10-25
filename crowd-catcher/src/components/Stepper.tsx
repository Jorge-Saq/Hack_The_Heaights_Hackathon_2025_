import { cn } from '@/lib/utils';

interface StepperProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function Stepper({ currentStep, totalSteps, className }: StepperProps) {
  return (
    <div className={cn('flex items-center justify-center space-x-4', className)}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        
        return (
          <div key={stepNumber} className="flex items-center">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                isCompleted && 'bg-sky-600 text-white',
                isCurrent && 'bg-sky-100 text-sky-600 border-2 border-sky-600',
                !isCompleted && !isCurrent && 'bg-slate-200 text-slate-600'
              )}
            >
              {isCompleted ? '✓' : stepNumber}
            </div>
            {index < totalSteps - 1 && (
              <div
                className={cn(
                  'h-0.5 w-8',
                  isCompleted ? 'bg-sky-600' : 'bg-slate-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
