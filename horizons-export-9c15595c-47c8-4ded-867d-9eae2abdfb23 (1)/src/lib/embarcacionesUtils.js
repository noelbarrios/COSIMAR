export const initialFormData = {
  nombreEmbarcacion: '',
  folio: '',
  basificacion: '', 
  zonaDespacho: '',
  tiempoDespacho: '',
  unidadTiempoDespacho: 'horas',
  fechaHoraSalida: null,
  propulsion: '',
  otraPropulsion: '', 
  
  propietarioNombre: '',
  propietarioCI: '',
  propietarioTelefono: '',
  propietarioDocumentoSalida: '',
  propietarioNumeroPermiso: '',
  
  patronNombre: '',
  patronCI: '',
  patronTelefono: '',
  patronDocumentoSalida: '',
  patronNumeroPermiso: '',
  
  tripulantes: [], 
  pasajeros: [], 
  comunicacionAbordo: '',
};


export const validateFormLogic = (formData, currentUser) => {
  const newErrors = {};
  if (!formData.nombreEmbarcacion) newErrors.nombreEmbarcacion = 'Nombre de la embarcación es obligatorio.';
  if (!formData.folio) newErrors.folio = 'Folio es obligatorio.';
  if (!formData.basificacion) newErrors.basificacion = 'Basificación es obligatoria.';
  if (currentUser?.role === 'Operador' && formData.basificacion !== currentUser.basificacion) {
    newErrors.basificacion = `Debe registrar en su basificación: ${currentUser.basificacion}`;
  }
  if (currentUser?.role === 'Operador Propietario' && formData.folio !== currentUser.folioEmbarcacionPropietario) {
    newErrors.folio = `Solo puede registrar su embarcación: ${currentUser.folioEmbarcacionPropietario}`;
  }

  if (!formData.zonaDespacho) newErrors.zonaDespacho = 'Zona de despacho (destino) es obligatoria.';
  if (!formData.tiempoDespacho || isNaN(parseFloat(formData.tiempoDespacho)) || parseFloat(formData.tiempoDespacho) <= 0) newErrors.tiempoDespacho = 'Tiempo de despacho debe ser un número positivo.';
  if (!formData.fechaHoraSalida) newErrors.fechaHoraSalida = 'Fecha y hora de salida son obligatorias.';
  if (!formData.propulsion) newErrors.propulsion = 'Propulsión es obligatoria.';
  if (formData.propulsion === 'otros' && !formData.otraPropulsion) newErrors.otraPropulsion = 'Especifique la propulsión.';

  const propietarioPresente = formData.propietarioNombre && formData.propietarioCI;
  const patronPresente = formData.patronNombre && formData.patronCI;

  if (!propietarioPresente && !patronPresente) {
    newErrors.propietarioPatron = 'Debe proporcionar al menos el nombre y CI del Propietario o del Patrón.';
  }

  const validatePersona = (persona, type, index) => {
    const prefix = `${type}${index !== null ? `_${index}` : ''}`;
    if (persona.nombreApellidos && !persona.ci && !persona.ciPasaporte) newErrors[`${prefix}_${type === 'pasajeros' ? 'ciPasaporte' : 'ci'}`] = 'CI/Pasaporte es obligatorio si el nombre está presente.';
    if ((persona.ci || persona.ciPasaporte) && !persona.nombreApellidos) newErrors[`${prefix}_nombreApellidos`] = 'Nombre es obligatorio si el CI/Pasaporte está presente.';
    
    if (persona.nombreApellidos && (persona.ci || persona.ciPasaporte)) { // Solo validar documento y permiso si la persona está completa
      if (!persona.documentoSalida) newErrors[`${prefix}_documentoSalida`] = 'Documento de salida es obligatorio.';
      if (!persona.numeroPermiso) newErrors[`${prefix}_numeroPermiso`] = 'Número de permiso es obligatorio.';
      if (persona.numeroPermiso && !/^\S+$/.test(persona.numeroPermiso)) newErrors[`${prefix}_numeroPermiso`] = 'Número de permiso no puede contener solo espacios.'; // O !/^\d+$/.test si debe ser numérico
    }
    if (persona.telefono && !/^\d+$/.test(persona.telefono)) newErrors[`${prefix}_telefono`] = 'Teléfono debe ser numérico.';
  };
  
  if (formData.propietarioNombre || formData.propietarioCI) validatePersona({ nombreApellidos: formData.propietarioNombre, ci: formData.propietarioCI, telefono: formData.propietarioTelefono, documentoSalida: formData.propietarioDocumentoSalida, numeroPermiso: formData.propietarioNumeroPermiso }, 'propietario', null);
  if (formData.patronNombre || formData.patronCI) validatePersona({ nombreApellidos: formData.patronNombre, ci: formData.patronCI, telefono: formData.patronTelefono, documentoSalida: formData.patronDocumentoSalida, numeroPermiso: formData.patronNumeroPermiso }, 'patron', null);
  
  formData.tripulantes.forEach((tripulante, index) => validatePersona(tripulante, 'tripulantes', index));
  formData.pasajeros.forEach((pasajero, index) => validatePersona(pasajero, 'pasajeros', index));
  
  return newErrors;
};

export const checkProhibicionesLogic = async (formData, supabase) => {
  const { data: embarcacionProhibida, error: errEmb } = await supabase
    .from('embarcaciones_prohibidas')
    .select('nombre_embarcacion, folio')
    .eq('folio', formData.folio)
    .single();

  if (errEmb && errEmb.code !== 'PGRST116') { // PGRST116: No rows found
    console.error("Error checking embarcacion prohibida:", errEmb);
  }
  if (embarcacionProhibida) {
    return { message: `Esta embarcación (${embarcacionProhibida.nombre_embarcacion} - ${embarcacionProhibida.folio}) tiene una prohibición de salida activa.` };
  }

  const personasEnFormulario = [
    ...(formData.propietarioCI ? [{ nombreCompleto: formData.propietarioNombre, ci: formData.propietarioCI, tipo: 'Propietario' }] : []),
    ...(formData.patronCI ? [{ nombreCompleto: formData.patronNombre, ci: formData.patronCI, tipo: 'Patrón' }] : []),
    ...formData.tripulantes.filter(t => t.ci).map((t, i) => ({ nombreCompleto: t.nombreApellidos, ci: t.ci, tipo: `Tripulante ${i+1}` })),
    ...formData.pasajeros.filter(p => p.ciPasaporte).map((p, i) => ({ nombreCompleto: p.nombreApellidos, ci: p.ciPasaporte, tipo: `Pasajero ${i+1}` })),
  ];

  const cisToCheck = personasEnFormulario.map(p => p.ci).filter(Boolean);
  if (cisToCheck.length > 0) {
    const { data: personasProhibidasResult, error: errPer } = await supabase
      .from('personas_prohibidas')
      .select('nombre_completo, ci')
      .in('ci', cisToCheck);

    if (errPer) {
      console.error("Error checking personas prohibidas:", errPer);
    }
    if (personasProhibidasResult && personasProhibidasResult.length > 0) {
      for (const pp of personasProhibidasResult) {
        const personaMatch = personasEnFormulario.find(p => p.ci === pp.ci);
        if (personaMatch) {
          return { message: `La persona ${personaMatch.nombreCompleto} (${personaMatch.tipo}) tiene una prohibición de salida activa.` };
        }
      }
    }
  }
  return null;
};