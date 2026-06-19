import React from 'react';
import SegmentedControl from './ui/SegmentedControl';

type ViewMode = 'streak' | 'customer_pov';

interface Props {
  activeMode: ViewMode;
  onChange: (mode: ViewMode) => void;
  variant?: 'partner' | 'customer';
}

export default function PartnerCustomerToggle({ activeMode, onChange, variant = 'partner' }: Props) {
  return (
    <SegmentedControl
      variant={variant}
      value={activeMode}
      onChange={onChange}
      segments={[
        { value: 'streak', label: 'Partner' },
        { value: 'customer_pov', label: 'Customer' },
      ]}
    />
  );
}
