/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/task'],
    /**
 * @param{record} record
 * @param{search} search
 * @param{task} task
 */
    (record, search, task) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            log.debug('request', scriptContext.request.parameters);
            let param = scriptContext.request.parameters;
            try {
                let id = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_th_mr_process_mass_label_pt',
                    params: {
                         'custscript_id_record_work': param.id
                    }
                }).submit();

                log.debug('inicio la creacion etiquetas', id)
                if(!!id){
                    let recordMap = record.create({
                        type : 'customrecord_th_map_execution_list',
                        isDynamic : true
                    });

                    recordMap.setValue('name', 'Creacion etiquetas PT');
                    recordMap.setValue('custrecord_thr_id_task', id);
                    recordMap.setValue('custrecord_thr_id_script', 'customscript_th_mr_process_mass_label_pt');

                    recordMap.save();

                }

            } catch (error) {
                log.debug('fallo creacion etiqueta', error);
            }
        }

        return {onRequest}

    });
