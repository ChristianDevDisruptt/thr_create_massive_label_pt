/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
 define(['N/search', 'N/log', 'N/record', 'N/runtime', 'N/currentRecord'], function (search, log, record, runtime, currentRecord) {

    function createLabel(context) {
        try {
            // CAMPOS ORDEN DE TRABAJO -------------------------------------------------------------
            var scriptRec = runtime.getCurrentScript();
            var fulfillId = scriptRec.getParameter("custscript_id_work_order");
            log.debug("newRecord", scriptRec);

            var newRecord = record.load({
                type: record.Type.WORK_ORDER,
                id: fulfillId,
                isDynamic: true
            });
            log.debug("newRecord", newRecord);

            var workOrder = newRecord.getValue('id');
            var sku = newRecord.getValue('assemblyitem');
            var order = newRecord.getValue('createdfrom');
            var customer = newRecord.getValue('entity');
            var dateLabel = newRecord.getValue('startdate');
            var tranDate = newRecord.getValue('trandate');
            var newDate = tranDate.toISOString();
            var date = newDate.substring(2, 10).split("-").join("");
            var quantity = newRecord.getValue('quantity');
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
            log.debug("results: ", results);

            // var salesLook = search.lookupFields({
            //     type: 'customer',
            //     id: customer,
            //     columns: ['custentity_trp_doble_bolsa_']
            // });
            // var dBolsa = salesLook.custentity_trp_doble_bolsa_
            // log.debug("dBolsa",dBolsa)
            // TIPO DE ETIQUETA -------------------------------------------------------------------
            var assemblyId = newRecord.getValue('assemblyitem');
            var asseRecord = context.newRecord;
            asseRecord = record.load({
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
            log.debug("compSearch", compSearch);

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
                //    createLabel.save()
                log.debug("contConsecutivo: ", contConsecutivo);
            } else {
                log.error('Ya se crearon ' + results.length + ' etiquetas');
            }

        } catch (e) {
            //log.debug("unidadesRestantes", currentUser.getRemainingUsage())
            log.error('Error :', e);
        }

    }

    return {
        execute: createLabel
    };
});