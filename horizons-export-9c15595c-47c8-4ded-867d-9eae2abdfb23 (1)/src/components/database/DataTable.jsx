import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const DataTable = ({ columns, data, sortConfig, requestSort, currentUser, isPersonaObservada }) => {
  const renderCellContent = (item, column) => {
    if (column.render) {
      return column.render(item);
    }
    let value = item[column.key];
    if (column.key === 'fecha_hora_salida' || column.key === 'fecha_hora_entrada') {
      value = value ? format(parseISO(value), 'dd/MM/yy HH:mm', { locale: es }) : 'N/A';
    } else if (column.key === 'propulsion' && item.propulsion === 'otros') {
      value = item.otra_propulsion || 'Otros';
    }
    return value === undefined || value === null ? 'N/A' : String(value);
  };

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table className="min-w-full">
        <TableHeader className="bg-slate-100 dark:bg-slate-800">
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>
                <Button
                  variant="ghost"
                  onClick={() => requestSort(column.key)}
                  className="px-0 hover:bg-transparent"
                >
                  {column.label}
                  <ArrowUpDown className={`ml-2 h-4 w-4 ${sortConfig.key === column.key ? 'text-primary' : 'text-muted-foreground/50'}`} />
                </Button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={item.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              {columns.map((column) => (
                <TableCell key={column.key} className="py-3 px-4">
                  {renderCellContent(item, column)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DataTable;