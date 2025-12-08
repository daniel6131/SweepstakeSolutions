import type React from 'react';

import { Card, Label, Number } from './styles';
import type { StatCardProps } from './types';

export const StatCard: React.FC<StatCardProps> = ({ number, label, delay = 0 }) => {
  return (
    <Card delay={delay}>
      <Number>{number}</Number>
      <Label>{label}</Label>
    </Card>
  );
};
