import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Ship } from 'lucide-react';
import { DialogTrigger } from '@/components/ui/dialog'; // Assuming DialogTrigger is used for delete confirmation

const UsersTable = ({ users, adminUserId, onEditUser, onSetUserToDelete }) => {
  if (users.length === 0) {
    return <p className="text-center text-muted-foreground py-4">No hay usuarios registrados.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Usuario (Email)</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Basificación</TableHead>
          <TableHead className="flex items-center"><Ship className="mr-1 h-4 w-4"/>Emb. Propietario</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.username}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>{user.basificacion || 'N/A'}</TableCell>
            <TableCell>
              {user.role === 'Operador Propietario' ? `${user.nombre_embarcacion_propietario || 'N/A'} (${user.folio_embarcacion_propietario || 'N/A'})` : 'N/A'}
            </TableCell>
            <TableCell className="space-x-2">
              <Button variant="outline" size="sm" onClick={() => onEditUser(user)} title="Editar Usuario">
                <Edit className="h-4 w-4" />
              </Button>
              {user.id !== adminUserId && ( 
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm" onClick={() => onSetUserToDelete(user)} title="Eliminar Usuario">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default UsersTable;