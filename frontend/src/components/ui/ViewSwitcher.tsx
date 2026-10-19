import React from 'react';
import { TableIcon, GridIcon } from '../icons';

export interface ViewSwitcherProps {
  view?: 'table' | 'grid';
  viewMode?: 'table' | 'grid';
  onChange: (view: 'table' | 'grid') => void;
  tableLabel?: string;
  gridLabel?: string;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  view,
  viewMode,
  onChange,
  tableLabel = 'List',
  gridLabel = 'Grid',
}) => {
  const activeView = viewMode || view || 'table';

  return (
    <div className="view-switch" role="group" aria-label="View layout options">
      <button
        type="button"
        className={`view-switch-btn ${activeView === 'table' ? 'active' : ''}`}
        onClick={() => onChange('table')}
        title="List / Table View"
      >
        <TableIcon size={14} />
        <span>{tableLabel}</span>
      </button>

      <button
        type="button"
        className={`view-switch-btn ${activeView === 'grid' ? 'active' : ''}`}
        onClick={() => onChange('grid')}
        title="Cards / Grid View"
      >
        <GridIcon size={14} />
        <span>{gridLabel}</span>
      </button>
    </div>
  );
};
