/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/email', 'N/file', 'N/record', 'N/runtime', 'N/search'],
    /**
 * @param{email} email
 * @param{file} file
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
    (email, file, record, runtime, search) => {
        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        const getInputData = (inputContext) => {
            let data = runtime.getCurrentScript().getParameter('custscript_id_record_work');
            log.debug('data', data);
            let workOrder = search.lookupFields({
                type: 'customrecord_thr_gen_massive_label_pt',
                id: data,
                columns: ['custrecord_thr_work_orders_select']
            });
            log.debug('workOrder', workOrder);
            if (workOrder.custrecord_thr_work_orders_select.length > 0) {
                return workOrder.custrecord_thr_work_orders_select;
            }

        }

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        const map = (mapContext) => {
            try {
                log.debug('mapContext', mapContext);
                let data = JSON.parse(mapContext.value);

                mapContext.write({
                    key: data.value,
                    value: data
                });
            } catch (error) {
                log.debug('error map', error);
            }

        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {
            log.debug('reduceContext', reduceContext);
            let data = JSON.parse(reduceContext.values[0]);
            log.debug('data reduce', data);
            try {
                var newRecord = record.load({
                    type: record.Type.WORK_ORDER,
                    id: data.value,
                    isDynamic: true
                });
                //log.debug("newRecord", newRecord);

                var workOrder = newRecord.getValue('id');
                var sku = newRecord.getValue('assemblyitem');
                var order = newRecord.getValue('createdfrom');
                var customer = newRecord.getValue('entity');
                var dateLabel = newRecord.getValue('startdate');
                var tranDate = newRecord.getValue('trandate');
                var newDate = tranDate.toISOString();
                var date = newDate.substring(2, 10).split("-").join("");
                var quantity = newRecord.getValue('quantity');
                var trandId = newRecord.getValue('tranid');
                log.debug("workOrder", workOrder);

                var sType = 'customrecord_trp_etiquetas';
                var sColumns = [];
                var sFilters = [];
                sColumns.push(search.createColumn({
                    name: "internalid"
                })),
                    sColumns.push(search.createColumn({
                        name: "custrecord_trp_consecutivo"
                    }));
                // sColumns.push(search.createColumn({ name: "subsidiary", join: "inventoryLocation" }))
                sFilters.push(["custrecord_trp_op", "anyof", workOrder]);
                var results = search.create({
                    type: sType,
                    columns: sColumns,
                    filters: sFilters
                }).run().getRange(0, 1000);
                //log.debug("results: ", results);

                // var salesLook = search.lookupFields({
                //     type: 'customer',
                //     id: customer,
                //     columns: ['custentity_trp_doble_bolsa_']
                // });
                // var dBolsa = salesLook.custentity_trp_doble_bolsa_
                // log.debug("dBolsa",dBolsa)
                // TIPO DE ETIQUETA -------------------------------------------------------------------
                var assemblyId = newRecord.getValue('assemblyitem');
                //var asseRecord = context.newRecord;
                var asseRecord = record.load({
                    type: record.Type.ASSEMBLY_ITEM,
                    id: assemblyId,
                    isDynamic: true
                });
                var tipoEtiqueta = asseRecord.getValue('custitem_bb_tipo_etiqueta');
                var tipoEti = asseRecord.getText('custitem_bb_tipo_etiqueta');
                var foo = tipoEtiqueta;
                switch (foo) {
                    case "1":
                        tipoEtiqueta = 0;
                        // log.debug('TIPO ETIQUETA: ',tipoEtiqueta + ' ' + tipoEti)
                        break;
                    case "2":
                        tipoEtiqueta = 1;
                        // log.debug('TIPO ETIQUETA: ',tipoEtiqueta + ' ' + tipoEti);
                        break;
                    case "3":
                        tipoEtiqueta = 2;
                        //    log.debug('TIPO ETIQUETA: ',tipoEtiqueta + ' ' + tipoEti);
                        break;
                    case "4":
                        tipoEtiqueta = 3;
                        // log.debug('TIPO ETIQUETA: ',tipoEtiqueta + ' ' + tipoEti);
                        break;
                    case "5":
                        tipoEtiqueta = 4;
                        //    log.debug('TIPO ETIQUETA: ',tipoEtiqueta + ' ' + tipoEti);
                        break;
                    case "6":
                        tipoEtiqueta = 5;
                        //    log.debug('TIPO ETIQUETA: ',tipoEtiqueta + ' ' + tipoEti);
                        break;
                    default:
                        log.debug('default');
                }

                // USUARIO -----------------------------------------------------------------------
                var currentUser = runtime.getCurrentScript();
                // log.debug("unidadesRestantes", currentUser.getRemainingUsage())
                var idUser = runtime.getCurrentUser().id;
                // log.debug("currentUser: ", currentUser + ' ' + idUser);

                var fecha = new Date();

                // CREAR BUSQUEDA DE OPERACIONES

                var sType = 'customrecord_trp_catalogo_de_operaciones';
                var sColumns = [];
                var sFilters = [];
                sColumns.push(search.createColumn({
                    name: 'custrecord_trp_nombre_operacion'
                }));
                sColumns.push(search.createColumn({
                    name: 'custrecord_trp_numero_op'
                }));
                sColumns.push(search.createColumn({
                    name: 'custrecord_trp_secuencia_op'
                }));
                sFilters.push(['custrecord_trp_articulo', 'is', sku]);
                var compSearch = search.create({
                    type: sType,
                    columns: sColumns,
                    filters: sFilters
                }).run().getRange(0, 10);
                //log.debug("compSearch", compSearch);

                // OBJETO PARA CREAR ETIQUETAS

                var ordenObj = {
                    idUser: idUser,
                    fecha: fecha,
                    workOrder: workOrder,
                    sku: sku,
                    order: order,
                    customer: customer,
                    // dBolsa :dBolsa,
                    dateLabel: dateLabel,
                    quantity: quantity
                };

                log.debug("quantity", ordenObj);
                //log.debug('ordenObj', ordenObj)

                if (results.length == 0) {
                    //CREAR REGISTRO ETIQUETAS
                    //
                    var result = search.create({
                        type: 'customrecord_trp_etiquetas',
                        filters: [
                            ['internalid', 'noneof', '0'],
                            'AND',
                            ['created', 'within', 'today']
                        ],
                        columns: [
                            search.createColumn({
                                name: 'internalid',
                                summary: 'COUNT'
                            })
                        ]
                    }).run().getRange({
                        start: 0,
                        end: 1
                    });
                    var conteoIdInterno = result[0].getValue({
                        name: 'internalid',
                        summary: 'COUNT'
                    });
                    // log.debug("idInterno: ", conteoIdInterno)

                    //------ Inicia busqueda nueva
                    var consecutivo = date + tipoEtiqueta;
                    var result1 = search.create({
                        type: 'customrecord_trp_etiquetas',
                        filters: [
                            ["custrecord_trp_sku.displayname", "isnotempty", "null"],
                            "AND",
                            ["custrecord_trp_consecutivo", "startswith", consecutivo]
                        ],
                        columns: [
                            search.createColumn({
                                name: "custrecord_trp_consecutivo",
                                summary: "MAX"
                            })
                        ]
                    }).run().getRange({
                        start: 0,
                        end: 1
                    });
                    var conteoIdInterno1 = result1[0].getValue({
                        name: 'custrecord_trp_consecutivo',
                        summary: 'MAX'
                    });

                    var conteo = 0;
                    log.debug("ConteaoEAC:", conteoIdInterno1.substring(7, 11))
                    conteo = parseFloat(conteoIdInterno1.substring(7, 11));
                    if (conteoIdInterno1 == "") {
                        conteo = 0;
                    }
                    conteo = parseFloat(conteo) + 1;
                    log.debug("Siguiente:", conteo);
                    //log.debug("Max:", conteo)
                    /*
                                    //var conteoIdInterno = 0;
                                    var conteo = "0";
                                    var consecutivo = date + tipoEtiqueta;
                                        for (var i = 0; i < fSearch.length; i++) {
                                    var serieResult = fSearch[i];
                    var noSerie =  serieResult.getValue({
                                        name: "custrecord_trp_consecutivo",
                                            summary: "MAX"
                                    });
                                
                              log.debug("NoSerie:", noSerie);
                              }
                                    var fSearch = search.create({
                                        type: "customrecord_trp_etiquetas",
                                        columns: [
                                            search.createColumn({
                                                name: "custrecord_trp_consecutivo",
                                                summary: "MAX"
                                            })
                                        ],
                                        filters: [
                                            ["custrecord_trp_sku.displayname", "isnotempty", "null"],
                                            "AND",
                                            ["custrecord_trp_consecutivo", "startswith", consecutivo]
                                        ]
                                    }).run().getRange(0, 1000);
                    
                                    log.debug('Search result:', fSearch);
                    
                                     //let resultArray = [];
                              
                    
                                    // log.debug('Result to be sended to app:', resultArray);
                                    //conteo = resultArray[0].noSerie;
                                    conteo = noSerie;
                                    log.debug("Conteo::", conteo);
                                    if (conteo.length === 0) {
                                        conteo = "0";
                                    } else {
                                        log.debug("conteo: ", conteo);
                                        conteo = conteo.substring(7, 11);
                                        log.debug("Conteo2:", conteo);
                                    }
                                    conteoIdInterno = parseFloat(conteo);
                    */
                    //------ Finaliza busqueda nueva


                    var sumaconteo = parseFloat(conteoIdInterno) + 1;
                    //se agrega esta linea para Solucionar el problema de los consecutivos (Eduardo Alvirde)
                    sumaconteo = parseFloat(conteo);
                    log.debug("sumaconteo: ", sumaconteo);
                    // NUMERO DE SERIE-----------------------------------------------------------------
                    // var arraySerie = [];
                    var contConsecutivo = 0;
                    for (var i = 1; i <= quantity; i++) {
                        // log.debug("FOR: ", currentUser.getRemainingUsage())
                        // log.debug("i: ", i)
                        var sec = '0000' + sumaconteo;
                        sec = sec.substring(sec.length - 4, sec.length);
                        var nSerie = date + tipoEtiqueta + sec;
                        contConsecutivo++;
                        log.debug("Etiqueta", nSerie);
                        //  arraySerie.push({nSerie : nSerie, contConsecutivo : contConsecutivo })
                        var createLabel = record.create({
                            type: 'customrecord_trp_etiquetas',
                            isDynamic: true
                        });
                        createLabel.setValue({
                            fieldId: 'custrecord_trp_usuario_ingreso',
                            value: ordenObj.idUser
                        });
                        createLabel.setValue({
                            fieldId: 'custrecord_trp_op',
                            value: ordenObj.workOrder
                        });
                        createLabel.setValue({
                            fieldId: 'custrecord_trp_cliente_',
                            value: ordenObj.customer
                        });
                        // createLabel.setValue({
                        //     fieldId: 'custrecord_trp_doble_bolsa',
                        //     value: ordenObj.dBolsa
                        // })
                        createLabel.setValue({
                            fieldId: 'custrecord_trp_pedido',
                            value: ordenObj.order
                        });
                        createLabel.setValue({
                            fieldId: 'custrecord_trp_f_ingreso',
                            value: ordenObj.fecha
                        });
                        createLabel.setValue({
                            fieldId: 'custrecord_trp_sku',
                            value: ordenObj.sku
                        });
                        createLabel.setValue({
                            fieldId: 'custrecord_trp_fe_etiqueta_pt',
                            value: ordenObj.dateLabel
                        });
                        createLabel.setValue({
                            fieldId: 'custrecord_trp_tot_etiquetas',
                            value: ordenObj.quantity
                        });
                        if (compSearch.length > 0) {
                            for (var r = 0; r < compSearch.length; r++) {
                                var numeroOP = compSearch[r].getValue({
                                    name: 'custrecord_trp_numero_op'
                                });
                                var NomOp = compSearch[r].getText({
                                    name: 'custrecord_trp_nombre_operacion'
                                });
                                var secuenciaId = compSearch[r].getValue({
                                    name: 'custrecord_trp_secuencia_op'
                                });
                                var idProceso = "custrecord_trp_id_proceso_" + secuenciaId;
                                var nombreOp = "custrecordtrp_nombre_proces_" + secuenciaId;
                                // log.debug("ID Proceso: ", idProceso + 'ID: ' + numeroOP )
                                var operacion = createLabel.setValue({
                                    fieldId: idProceso,
                                    value: numeroOP
                                });
                                var nombre = createLabel.setValue({
                                    fieldId: nombreOp,
                                    value: NomOp
                                });
                            };
                        };

                        createLabel.setValue({
                            fieldId: 'externalid',
                            value: nSerie
                        });
                        createLabel.setValue({
                            fieldId: 'custrecord_trp_consecutivo',
                            value: nSerie
                        });
                        createLabel.setValue({
                            fieldId: 'custrecord_trp_n_etiqueta',
                            value: contConsecutivo
                        });

                        // log.debug('serie: ', serie);
                        // log.debug('nombre: ', nombre);

                        var idEtiqueta = createLabel.save();
                        // log.debug("idEtiqueta: ", idEtiqueta)
                        // createLabel.setValue({
                        //     fieldId: 'custrecord_trp_id_etiqueta',
                        //     value: idEtiqueta
                        // })
                        sumaconteo++;
                        log.debug("contConsecutivo: ", contConsecutivo);
                    }
                    if (contConsecutivo == quantity) {
                        log.debug("contConsecutivo Final: ", contConsecutivo);
                        let id = email.send({
                            //author: 1729,
                            author: 2039,
                            //recipients: ['christian.canul@disruptt.mx'],
                            recipients: 2039,
                            subject: 'Orden de trabajo generada',
                            body: `La siguiente Orden de Trabajo ha sido procesada por completo ${trandId}`

                        });
                        log.audit("email success", id)
                        record.submitFields({
                            type: record.Type.WORK_ORDER,
                            id: workOrder,
                            values: {
                                'custbody_th_generated_labels_pt': true
                            }
                        })
                        reduceContext.write({
                            key: 'nuevas',
                            value: workOrder
                        })
                    }
                } else {
                    log.error('Ya se crearon ' + results.length + ' etiquetas');
                    reduceContext.write({
                        key: 'creadas',
                        value: workOrder
                    })
                }

            } catch (error) {
                log.debug('error reduce', error);
            }
        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {
            try {

                let completeResult = [];
                let planedResult = [];                 
                summaryContext.output.iterator().each(function (key, value) {
                    log.debug('keys desde el summary output', key)
                    log.debug('value desde el summary output', value)
                    if(key == 'nuevas'){
                        completeResult.push(value);
                    }else if(key == 'creadas'){
                        planedResult.push(value);
                    }

                    return true;
                });

                record.submitFields({
                    type: 'customrecord_thr_gen_massive_label_pt',
                    id: runtime.getCurrentScript().getParameter('custscript_id_record_work'),
                    values: {
                        'custrecord_thr_finished_labels': true,
                        'custrecord_thr_was_create_label_pt' : completeResult,
                        'custrecord_thr_was_pre_procces' : planedResult,
                    }
                })
            } catch (error) {
                log.debug('error summarize', error)
            }
            const thereAreAnyError = (summaryContext) => {
                const inputSummary = summaryContext.inputSummary;
                const mapSummary = summaryContext.mapSummary;
                const reduceSummary = summaryContext.reduceSummary;
                //si no hay errores entonces se sale del la función y se retorna false incando que no hubo errores            if (!inputSummary.error) return false;
                //se hay errores entonces se imprimen los errores en el log para poder visualizarlos            if (inputSummary.error) log.debug("ERROR_INPPUT_STAGE", `Erro: ${inputSummary.error}`);
                handleErrorInStage('map', mapSummary);
                handleErrorInStage('reduce', reduceSummary);

                function handleErrorInStage(currentStage, summary) {
                    summary.errors.iterator().each((key, value) => {
                        log.debug(`ERROR_${currentStage}`, `Error( ${currentStage} ) with key: ${key}.Detail: ${JSON.parse(value).message}`);
                        return true;
                    });
                }
                return true;
            };

            thereAreAnyError(summaryContext)
            log.audit('Summary', [
                { title: 'Usage units consumed', details: summaryContext.usage },
                { title: 'Concurrency', details: summaryContext.concurrency },
                { title: 'Number of yields', details: summaryContext.yields }
            ]);
        }

        return { getInputData, map, reduce, summarize }

    });
