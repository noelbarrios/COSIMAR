import React from 'react';
import { Button } from '@/components/ui/button';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="mt-6 flex justify-center items-center space-x-2">
      <Button
        onClick={() => onPageChange(prev => Math.max(1, prev - 1))}
        disabled={currentPage === 1}
        variant="outline"
      >
        Anterior
      </Button>
      <span className="text-sm text-muted-foreground">
        Página {currentPage} de {totalPages}
      </span>
      <Button
        onClick={() => onPageChange(prev => Math.min(totalPages, prev + 1))}
        disabled={currentPage === totalPages}
        variant="outline"
      >
        Siguiente
      </Button>
    </div>
  );
};

export default Pagination;