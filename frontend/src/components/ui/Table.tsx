import React from 'react';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  className = '',
  children,
  style,
  ...props
}) => {
  return (
    <div className="table-container">
      <table className={`data-table ${className}`.trim()} style={style} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  ...props
}) => {
  return <thead {...props}>{children}</thead>;
};

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  ...props
}) => {
  return <tbody {...props}>{children}</tbody>;
};

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  className = '',
  onClick,
  ...props
}) => {
  const handleClick = onClick
    ? (e: React.MouseEvent<HTMLTableRowElement>) => {
        const target = e.target as HTMLElement;
        if (target.closest('button, a, input, select, textarea, [data-prevent-row-click], .action-group')) {
          return;
        }
        onClick(e);
      }
    : undefined;

  const combinedClass = `${onClick ? 'clickable-row' : ''} ${className}`.trim();

  return (
    <tr className={combinedClass || undefined} onClick={handleClick} {...props}>
      {children}
    </tr>
  );
};

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className = '',
  children,
  style,
  ...props
}) => {
  return (
    <th className={className} style={style} {...props}>
      {children}
    </th>
  );
};

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className = '',
  children,
  style,
  ...props
}) => {
  return (
    <td className={className} style={style} {...props}>
      {children}
    </td>
  );
};

export interface TableEmptyProps {
  colSpan: number;
  message?: string;
  icon?: React.ReactNode;
}

export const TableEmpty: React.FC<TableEmptyProps> = ({
  colSpan,
  message = 'No records found matching criteria.',
  icon,
}) => {
  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'var(--text-muted)',
          fontSize: '13.5px',
        }}
      >
        {icon && <div style={{ marginBottom: '8px', opacity: 0.6 }}>{icon}</div>}
        <div>{message}</div>
      </td>
    </tr>
  );
};
