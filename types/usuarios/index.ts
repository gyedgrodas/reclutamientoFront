export interface UsuarioInterface {

        isDisabled: false,

        isDisabledEdit: false,

        id: number;
        
        usuario_dominio: string;
        
        cif: string;
        
        asociado_id: string;
        
        codigo_bankworks: string;
        
        codigo_ejecutivo: string;
        
        fecha_labores: string;
        
        email: string;
        
        nombre: string;
        
        apellido: string;
        
        password: string;
        
        estado: string;
        
        nuevoPassword: string;
        
        fecha_entra_vacaciones: string;
        
        fecha_sale_vaciones: string;
        
        puesto_id: string;
        
        region_id: string;
        
        gerencia_id: string;
        
        revisor_id: string;
        
        unidad_id: string;
        
        fecha_puestoactual: string;
        
        dpi: string;
        
        categoria_oficial_id: string;
        
        numero_cuenta_comision: string;
        
        solicitudcredito_verificador: string;
        
        solicitudcredito_gestor: string;
        
        solicitudcredito_operador: string;
        
        solicitudcredito_analista: string;
        
        cola_solitudes_analisis_operador_formalizacion: string;
        
        cola_solitudes_analisis_gestor_formalizacion: string;
        
        ctc_ventas: string;
        
        ctc_sclientes: string;
        
        ctc_cobros: string;
        
        gestiones_crm_vencidas: string;

        tieneDobleFactorActivo: boolean;

        two_factor_habilitado: boolean;


        

}
