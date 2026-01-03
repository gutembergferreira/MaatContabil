export const openApiSpec = {
    openapi: '3.0.0',
    info: {
        title: 'MaatContabil API',
        version: '1.0.0',
        description: 'Documentacao dos endpoints do backend.'
    },
    servers: [
        { url: '/api', description: 'Relative API base' }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        },
        schemas: {
            HealthResponse: {
                type: 'object',
                properties: { ok: { type: 'boolean', example: true } }
            },
            StatusResponse: {
                type: 'object',
                properties: { configured: { type: 'boolean', example: true } }
            },
            SetupDbRequest: {
                type: 'object',
                properties: {
                    host: { type: 'string', example: 'localhost' },
                    port: { type: 'string', example: '5432' },
                    user: { type: 'string', example: 'postgres' },
                    pass: { type: 'string', example: 'postgres' },
                    dbName: { type: 'string', example: 'maat_contabil' },
                    ssl: { type: 'boolean', example: false }
                },
                required: ['host', 'port', 'user', 'pass', 'dbName']
            },
            SetupDbResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    logs: { type: 'array', items: { type: 'string' } }
                }
            },
            AppSettingsRequest: {
                type: 'object',
                properties: { apiBaseUrl: { type: 'string', example: 'http://localhost:3001' } }
            },
            AppSettingsResponse: {
                type: 'object',
                properties: { apiBaseUrl: { type: 'string', example: 'http://localhost:3001' } }
            },
            DbConfigResponse: {
                type: 'object',
                properties: {
                    host: { type: 'string', example: 'localhost' },
                    port: { type: 'string', example: '5432' },
                    dbName: { type: 'string', example: 'maat_contabil' },
                    ssl: { type: 'boolean', example: false }
                }
            },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'uuid' },
                    name: { type: 'string', example: 'Carlos Admin' },
                    email: { type: 'string', example: 'admin@maat.com' },
                    role: { type: 'string', example: 'admin' },
                    companyId: { type: 'string', example: 'uuid' },
                    cpf: { type: 'string', example: '00000000000' }
                }
            },
            LoginRequest: {
                type: 'object',
                properties: {
                    email: { type: 'string', example: 'admin@maat.com' },
                    password: { type: 'string', example: 'admin' }
                },
                required: ['email', 'password']
            },
            LoginResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    token: { type: 'string', example: 'token' },
                    user: { $ref: '#/components/schemas/User' }
                }
            },
            CompanyUpsertRequest: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'uuid' },
                    name: { type: 'string', example: 'Empresa Demo LTDA' },
                    cnpj: { type: 'string', example: '00.000.000/0001-00' },
                    legalName: { type: 'string', example: 'Empresa Demo LTDA' },
                    tradeName: { type: 'string', example: 'Empresa Demo' },
                    phones: { type: 'string', example: '1199999999' },
                    addressZip: { type: 'string', example: '01001-000' },
                    addressStreet: { type: 'string', example: 'Rua Demo' },
                    addressNumber: { type: 'string', example: '100' },
                    addressCity: { type: 'string', example: 'Sao Paulo' },
                    addressState: { type: 'string', example: 'SP' }
                }
            },
            CompanyUpsertResponse: {
                type: 'object',
                properties: { success: { type: 'boolean', example: true }, id: { type: 'string', example: 'uuid' } }
            },
            ObligationUpsertRequest: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'uuid' },
                    name: { type: 'string', example: 'Emissao de DAS' },
                    department: { type: 'string', example: 'Fiscal' },
                    monthlyDue: {
                        type: 'object',
                        example: { '1': '20', '2': '20', '3': '20' }
                    }
                },
                required: ['name']
            },
            GenericSuccess: {
                type: 'object',
                properties: { success: { type: 'boolean', example: true } }
            },
            MonthlyRoutineUpdateRequest: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'uuid' },
                    status: { type: 'string', example: 'Concluido' }
                },
                required: ['id', 'status']
            },
            HrAdmissionRequest: { type: 'object' },
            HrRequest: { type: 'object' },
            HrFeedback: { type: 'object' },
            HrWorksite: { type: 'object' },
            HrEmployee: { type: 'object' },
            TimeSheet: { type: 'object' },
            TimeEntry: { type: 'object' },
            TimeComment: { type: 'object' },
            Payroll: { type: 'object' },
            NotificationBulk: { type: 'object' },
            PresignRequest: {
                type: 'object',
                properties: {
                    key: { type: 'string', example: 'uploads/arquivo.pdf' },
                    contentType: { type: 'string', example: 'application/pdf' }
                },
                required: ['key', 'contentType']
            },
            PresignResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    url: { type: 'string', example: 'https://nyc3.digitaloceanspaces.com/bucket/key' },
                    key: { type: 'string', example: 'uploads/arquivo.pdf' }
                }
            },
            ErrorResponse: {
                type: 'object',
                properties: { error: { type: 'string', example: 'Erro' } }
            }
        }
    },
    security: [{ bearerAuth: [] }],
    paths: {
        '/health': {
            get: {
                summary: 'Health check',
                security: [],
                responses: {
                    200: {
                        description: 'OK',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } }
                    }
                }
            }
        },
        '/status': {
            get: {
                summary: 'Backend status',
                security: [],
                responses: {
                    200: {
                        description: 'Status',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/StatusResponse' } } }
                    }
                }
            }
        },
        '/setup-db': {
            post: {
                summary: 'Configura banco de dados e executa schema',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/SetupDbRequest' },
                            examples: {
                                default: {
                                    value: {
                                        host: 'localhost',
                                        port: '5432',
                                        user: 'postgres',
                                        pass: 'postgres',
                                        dbName: 'maat_contabil',
                                        ssl: false
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Resultado da configuracao',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/SetupDbResponse' } } }
                    }
                }
            }
        },
        '/app-settings': {
            get: {
                summary: 'Obtem configuracoes da aplicacao',
                security: [],
                responses: {
                    200: {
                        description: 'Settings',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/AppSettingsResponse' } } }
                    }
                }
            },
            post: {
                summary: 'Atualiza configuracoes da aplicacao',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/AppSettingsRequest' },
                            examples: {
                                default: { value: { apiBaseUrl: 'http://localhost:3001' } }
                            }
                        }
                    }
                },
                responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/db-config': {
            get: {
                summary: 'Obtem configuracao de DB salva',
                security: [],
                responses: {
                    200: {
                        description: 'Config',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/DbConfigResponse' } } }
                    }
                }
            }
        },
        '/sync': {
            get: {
                summary: 'Sincroniza dados principais',
                responses: {
                    200: {
                        description: 'Payload sync',
                        content: { 'application/json': { schema: { type: 'object' } } }
                    }
                }
            }
        },
        '/login': {
            post: {
                summary: 'Login (admin/cliente/funcionario)',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LoginRequest' },
                            examples: {
                                admin: { value: { email: 'admin@maat.com', password: 'admin' } },
                                employee: { value: { email: '00000000000', password: '31081989' } }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Token e usuario',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } }
                    },
                    401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
                }
            }
        },
        '/company': {
            post: {
                summary: 'Cria/atualiza empresa',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CompanyUpsertRequest' },
                            examples: {
                                default: {
                                    value: {
                                        name: 'Empresa Demo LTDA',
                                        cnpj: '00.000.000/0001-00',
                                        legalName: 'Empresa Demo LTDA',
                                        tradeName: 'Empresa Demo',
                                        phones: '1199999999',
                                        addressZip: '01001-000',
                                        addressStreet: 'Rua Demo',
                                        addressNumber: '100',
                                        addressCity: 'Sao Paulo',
                                        addressState: 'SP'
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Empresa salva', content: { 'application/json': { schema: { $ref: '#/components/schemas/CompanyUpsertResponse' } } } }
                }
            }
        },
        '/company/{id}': {
            delete: {
                summary: 'Remove empresa',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Removida', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/obligations': {
            post: {
                summary: 'Cria/atualiza obrigacao',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ObligationUpsertRequest' },
                            examples: {
                                default: { value: { name: 'Emissao de DAS', department: 'Fiscal', monthlyDue: { '1': '20' } } }
                            }
                        }
                    }
                },
                responses: { 200: { description: 'Obrigacao salva', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/obligations/{id}': {
            delete: {
                summary: 'Remove obrigacao',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Removida', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/monthly-routines': {
            post: {
                summary: 'Atualiza status de rotina mensal',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/MonthlyRoutineUpdateRequest' },
                            examples: { default: { value: { id: 'uuid', status: 'Concluido' } } }
                        }
                    }
                },
                responses: { 200: { description: 'Atualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/monthly-routines/attachment': {
            post: {
                summary: 'Upload de anexo de rotina mensal',
                requestBody: {
                    required: true,
                    content: { 'multipart/form-data': { schema: { type: 'object' } } }
                },
                responses: { 200: { description: 'Arquivo salvo' } }
            }
        },
        '/hr/admission': {
            post: {
                summary: 'Cria/atualiza admissao',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/HrAdmissionRequest' } } } },
                responses: { 200: { description: 'Admissao salva', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/hr/request': {
            post: {
                summary: 'Cria/atualiza solicitacao RH',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/HrRequest' } } } },
                responses: { 200: { description: 'Solicitacao salva', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/hr/feedback': {
            post: {
                summary: 'Cria/atualiza feedback de campo RH',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/HrFeedback' } } } },
                responses: { 200: { description: 'Feedback salvo', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/hr/worksite': {
            post: {
                summary: 'Cria posto/sector',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/HrWorksite' } } } },
                responses: { 200: { description: 'Posto salvo', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/hr/employee': {
            post: {
                summary: 'Cria/atualiza funcionario',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/HrEmployee' } } } },
                responses: { 200: { description: 'Funcionario salvo', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/hr/time-sheet': {
            post: {
                summary: 'Cria/atualiza folha de ponto',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TimeSheet' } } } },
                responses: { 200: { description: 'Folha salva', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/hr/time-entry': {
            post: {
                summary: 'Cria/atualiza registro de ponto',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TimeEntry' } } } },
                responses: { 200: { description: 'Registro salvo', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/hr/time-comment': {
            post: {
                summary: 'Adiciona comentario em ponto',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TimeComment' } } } },
                responses: { 200: { description: 'Comentario salvo', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/hr/time-approve': {
            post: {
                summary: 'Aprova folha de ponto',
                requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', example: { timeSheetId: 'uuid', approvedBy: 'uuid' } } } } },
                responses: { 200: { description: 'Aprovada', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/hr/time-sign': {
            post: {
                summary: 'Assina folha de ponto',
                requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', example: { timeSheetId: 'uuid' } } } } },
                responses: { 200: { description: 'Assinada', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/hr/payroll': {
            post: {
                summary: 'Cria/atualiza holerite',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Payroll' } } } },
                responses: { 200: { description: 'Holerite salvo', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/hr/attachment': {
            post: {
                summary: 'Upload de anexo RH',
                requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object' } } } },
                responses: { 200: { description: 'Anexo salvo' } }
            }
        },
        '/hr/attachment/file/{id}': {
            get: {
                summary: 'Download de anexo RH',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Arquivo' } }
            }
        },
        '/notifications/read': {
            post: {
                summary: 'Marca notificacao como lida',
                requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', example: { id: 'uuid' } } } } },
                responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/notifications': {
            post: {
                summary: 'Cria/atualiza notificacoes',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/NotificationBulk' } } } },
                responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/notifications/{id}': {
            put: {
                summary: 'Atualiza notificacao',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', example: { title: 'Titulo', message: 'Mensagem' } } } } },
                responses: { 200: { description: 'Atualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            },
            delete: {
                summary: 'Remove notificacao',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Removida', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/cep/{cep}': {
            get: {
                summary: 'Consulta CEP',
                security: [],
                parameters: [{ name: 'cep', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Endereco' } }
            }
        },
        '/pix': {
            post: {
                summary: 'Gera cobranca PIX',
                security: [],
                requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
                responses: { 200: { description: 'PIX gerado' } }
            }
        },
        '/upload-cert': {
            post: {
                summary: 'Upload de certificados PIX',
                security: [],
                requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object' } } } },
                responses: { 200: { description: 'Certificados salvos' } }
            }
        },
        '/uploads/presign': {
            post: {
                summary: 'Gera URL presigned para upload em Spaces',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/PresignRequest' } } }
                },
                responses: { 200: { description: 'URL gerada', content: { 'application/json': { schema: { $ref: '#/components/schemas/PresignResponse' } } } } }
            }
        }
    }
};
