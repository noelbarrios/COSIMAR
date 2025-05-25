import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';

const UserForm = ({ userData, setUserData, errors, allBasificaciones, handleSubmit, isEdit = false }) => {
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value) => {
    let newBasificacion = userData.basificacion;
    if (value === 'Administrador') {
        newBasificacion = 'Todas';
    } else if (value === 'Visualizador' && (!allBasificaciones.includes(userData.basificacion) && userData.basificacion !== 'Todas')) {
        newBasificacion = 'Todas';
    } else if (value === 'Operador' && userData.basificacion === 'Todas') {
        newBasificacion = allBasificaciones.length > 1 && allBasificaciones[1] ? allBasificaciones[1] : '';
    }

    setUserData(prev => ({
      ...prev,
      role: value,
      basificacion: newBasificacion,
      nombre_embarcacion_propietario: value === 'Operador Propietario' ? prev.nombre_embarcacion_propietario : '',
      folio_embarcacion_propietario: value === 'Operador Propietario' ? prev.folio_embarcacion_propietario : '',
    }));
  };

  const handleBasificacionChange = (value) => {
    setUserData(prev => ({ ...prev, basificacion: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor={isEdit ? "edit_username" : "username"}>
          Usuario (Este será el Email de inicio de sesión)
        </Label>
        <Input 
          id={isEdit ? "edit_username" : "username"} 
          name="username" 
          type="email" 
          value={userData.username} 
          onChange={handleInputChange} 
          className={errors.username ? 'border-red-500' : ''} 
          placeholder="ejemplo@dominio.com"
        />
        {errors.username && <p className="text-sm text-red-500 mt-1">{errors.username}</p>}
      </div>
      <div>
        <Label htmlFor={isEdit ? "edit_password" : "password"}>
          {isEdit ? "Nueva Contraseña (opcional)" : "Contraseña"}
        </Label>
        <Input 
          id={isEdit ? "edit_password" : "password"} 
          name="password" 
          type="password" 
          value={userData.password || ''} 
          onChange={handleInputChange} 
          className={errors.password ? 'border-red-500' : ''} 
          placeholder={isEdit ? "Dejar en blanco para no cambiar" : "Mínimo 6 caracteres"}
        />
        {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
      </div>
      <div>
        <Label htmlFor={isEdit ? "edit_role" : "role"}>Rol</Label>
        <Select value={userData.role} onValueChange={handleRoleChange}>
          <SelectTrigger className={errors.role ? 'border-red-500' : ''}><SelectValue placeholder="Seleccione un rol" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Administrador">Administrador</SelectItem>
            <SelectItem value="Operador">Operador</SelectItem>
            <SelectItem value="Operador Propietario">Operador Propietario</SelectItem>
            <SelectItem value="Visualizador">Visualizador</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && <p className="text-sm text-red-500 mt-1">{errors.role}</p>}
      </div>
      {(userData.role === 'Operador' || userData.role === 'Operador Propietario' || userData.role === 'Visualizador') && (
        <div>
          <Label htmlFor={isEdit ? "edit_basificacion" : "basificacion"}>Basificación (Zona)</Label>
          <Select 
            value={userData.basificacion} 
            onValueChange={handleBasificacionChange} 
            disabled={userData.role === 'Administrador'}
          >
            <SelectTrigger className={errors.basificacion ? 'border-red-500' : ''}>
              <SelectValue placeholder="Seleccione basificación"/>
            </SelectTrigger>
            <SelectContent>
              {allBasificaciones.map(b => <SelectItem key={`${isEdit ? 'edit' : 'new'}-${b}`} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.basificacion && <p className="text-sm text-red-500 mt-1">{errors.basificacion}</p>}
        </div>
      )}
      {userData.role === 'Operador Propietario' && (
        <>
          <div>
            <Label htmlFor={isEdit ? "edit_nombre_embarcacion_propietario" : "nombre_embarcacion_propietario"}>Nombre Embarcación</Label>
            <Input 
              id={isEdit ? "edit_nombre_embarcacion_propietario" : "nombre_embarcacion_propietario"} 
              name="nombre_embarcacion_propietario" 
              value={userData.nombre_embarcacion_propietario || ''} 
              onChange={handleInputChange} 
              placeholder="Nombre de su embarcación" 
              className={errors.nombre_embarcacion_propietario ? 'border-red-500' : ''} 
            />
            {errors.nombre_embarcacion_propietario && <p className="text-sm text-red-500 mt-1">{errors.nombre_embarcacion_propietario}</p>}
          </div>
          <div>
            <Label htmlFor={isEdit ? "edit_folio_embarcacion_propietario" : "folio_embarcacion_propietario"}>Folio Embarcación</Label>
            <Input 
              id={isEdit ? "edit_folio_embarcacion_propietario" : "folio_embarcacion_propietario"} 
              name="folio_embarcacion_propietario" 
              value={userData.folio_embarcacion_propietario || ''} 
              onChange={handleInputChange} 
              placeholder="Folio de su embarcación" 
              className={errors.folio_embarcacion_propietario ? 'border-red-500' : ''} 
            />
            {errors.folio_embarcacion_propietario && <p className="text-sm text-red-500 mt-1">{errors.folio_embarcacion_propietario}</p>}
          </div>
        </>
      )}
      <Button 
        type="submit" 
        className={`w-full font-semibold text-white ${isEdit ? 'bg-green-500 hover:bg-green-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'}`}
      >
        {isEdit ? <><Save className="mr-2 h-4 w-4"/>Guardar Cambios</> : 'Crear Usuario'}
      </Button>
    </form>
  );
};

export default UserForm;