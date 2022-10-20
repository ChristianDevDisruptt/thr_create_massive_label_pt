/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/task'],
    /**
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{task} task
 */
    (record, runtime, search, task) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            try {
                let newRecord = scriptContext.newRecord;
                let form = scriptContext.form;
                form.clientScriptModulePath = './thr_cs_lib_btn_massive_pt.js';
                let finished = newRecord.getValue('custrecord_thr_finished_labels');
                if (scriptContext.type == scriptContext.UserEventType.VIEW) {
                    form.removeButton({
                        id: 'edit',
                    });
                    //Validamos que el boton aparezca siempre y cuando no este finalizado 
                    let statusRecord = newRecord.getValue('custrecord_thr_finished_labels');
                    log.debug('statusRecord', statusRecord);
                    //Y que el status del map reduce este libre (dejare pendiente la validacion del map)                    
                    let map = statusMap();
                    log.debug('map', map)
                    if(map && !statusRecord){
                        let btnPT = form.addButton({
                            id: 'custpage_btn_gen_label',
                            label: 'Generar Etiquetas',
                            functionName: 'callMap("' + newRecord.id + '")'
                        });
                    }                    

                } else if (scriptContext.type == scriptContext.UserEventType.EDIT) {
                    form.removeButton({
                        id: 'submitter',
                    });
                }
            } catch (error) {
                log.debug('error', error);
            }


        }

        const statusMap = () => {
            const idMap = 'customscript_th_mr_process_mass_label_pt';
            let status = false;

            let customrecord_th_map_execution_listSearchObj = search.create({
                type: "customrecord_th_map_execution_list",
                filters:
                    [
                        ["created", "within", "today"],
                        "AND",
                        ["custrecord_thr_id_script", "is", "customscript_th_mr_process_mass_label_pt"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "name",
                            label: "Name"
                        }),
                        search.createColumn({ name: "custrecord_thr_id_task", label: "Id Task" }),
                        search.createColumn({ name: "custrecord_thr_id_script", label: "Script" }),
                        search.createColumn({
                            name: "created",
                            sort: search.Sort.DESC,
                            label: "Date Created"
                        })
                    ]
            });
            let searchResultCount = customrecord_th_map_execution_listSearchObj.runPaged().count;
            log.debug("customrecord_th_map_execution_listSearchObj result count", searchResultCount);
            if(searchResultCount > 0){
                //Si devuelve datos toca revisar el status de la ultima ejecucion para saber si hay en ejecucion y ver si podemos bloquear el boton
                customrecord_th_map_execution_listSearchObj.run().each(function (result) {
                    // .run().each has a limit of 4,000 results
                    let taskId = result.getValue({name: "custrecord_thr_id_task", label: "Id Task"})
                    let myTaskStatus = task.checkStatus({
                        taskId: taskId
                    });
                    log.debug('myTaskStatus', myTaskStatus)
                    if (myTaskStatus.status === task.TaskStatus.COMPLETE) {
                        // Handle the status
                        status = true;
                    }
                    //return true;
                });
            }else{
                //En caso de no existir es por que no se ha ejecutado en el dia de hoy
                status = true;
            }

            return status;

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {

        }

        return { beforeLoad, beforeSubmit, afterSubmit }

    });
