import { cn } from '../../utils/cn';
import './Skeleton.css';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton = ({ className, ...props }: SkeletonProps) => {
  return (
    <div
      className={cn("skeleton-base", className)}
      {...props}
    />
  );
};

export { Skeleton };
