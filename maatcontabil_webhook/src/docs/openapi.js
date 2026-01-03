export const openApiSpec = {
    openapi: '3.0.0',
    info: {
        title: 'MaatContabil API',
        version: '1.0.0',
        description: 'Documentacao dos endpoints do backend. Fluxo auth: POST /login -> token Bearer (Authorization: Bearer <token>) para endpoints protegidos.'
    },
    servers: [{ url: '/api', description: 'Relative API base' }],
    tags: [
        { name: 'Health', description: 'Health checks' },
        { name: 'Setup', description: 'Configuracao e bootstrap' },
        { name: 'Auth', description: 'Autenticacao' },
        { name: 'Sync', description: 'Sincronizacao geral' },
        { name: 'Companies', description: 'Empresas' },
        { name: 'Obligations', description: 'Obrigacoes e rotinas mensais' },
        { name: 'HR', description: 'Departamento pessoal' },
        { name: 'Notifications', description: 'Notificacoes' },
        { name: 'Misc', description: 'Utilitarios e integracoes' },
        { name: 'Uploads', description: 'Uploads e presign' }
    ],
    components: {
        securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
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
                    monthlyDue: { type: 'object', example: { '1': '20', '2': '20' } }
                },
                required: ['name']
            },
            MonthlyRoutineUpdateRequest: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'uuid' },
                    status: { type: 'string', example: 'Concluido' }
                },
                required: ['id', 'status']
            },
            HrAdmissionRequest: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'uuid' },
                    companyId: { type: 'string', example: 'uuid' },
                    clientId: { type: 'string', example: 'uuid' },
                    status: { type: 'string', example: 'Novo' },
                    fullName: { type: 'string', example: 'GUTEMBERG BRITO FERREIRA' },
                    cpf: { type: 'string', example: '98522884234' },
                    rg: { type: 'string', example: '1234567' },
                    birthDate: { type: 'string', example: '1989-08-31' },
                    birthCity: { type: 'string', example: 'Manaus' },
                    birthState: { type: 'string', example: 'AM' },
                    nationality: { type: 'string', example: 'Brasileira' },
                    motherName: { type: 'string', example: 'Maria Monica Brito Matos' },
                    fatherName: { type: 'string', example: 'Geraldo Alves Ferreira' },
                    educationLevel: { type: 'string', example: 'Superior Completo' },
                    gender: { type: 'string', example: 'Masculino' },
                    maritalStatus: { type: 'string', example: 'Casado(a)' },
                    role: { type: 'string', example: 'Desenvolvedor 2' },
                    contractType: { type: 'string', example: 'CLT' },
                    weeklyHours: { type: 'integer', example: 40 },
                    shift: { type: 'string', example: 'Diurno' },
                    salary: { type: 'number', example: 5000 },
                    workSiteId: { type: 'string', example: 'uuid' },
                    expectedStartDate: { type: 'string', example: '2025-12-20' },
                    pis: { type: 'string', example: '123456789' },
                    tituloEleitor: { type: 'string', example: '123456789' },
                    tituloEleitorZone: { type: 'string', example: '155' },
                    tituloEleitorSection: { type: 'string', example: '10' },
                    ctps: { type: 'string', example: '080024' },
                    ctpsSeries: { type: 'string', example: '001' },
                    ctpsUf: { type: 'string', example: 'AM' },
                    reservista: { type: 'string', example: '1010102020' },
                    email: { type: 'string', example: 'gutemberg.bferreira@gmail.com' },
                    phone: { type: 'string', example: '(92) 9 9303-2908' },
                    addressZip: { type: 'string', example: '69097-452' },
                    addressStreet: { type: 'string', example: 'Rua Saint Petersburg' },
                    addressNumber: { type: 'string', example: '11' },
                    addressComplement: { type: 'string', example: '' },
                    addressDistrict: { type: 'string', example: 'Nova Cidade' },
                    addressCity: { type: 'string', example: 'Manaus' },
                    addressState: { type: 'string', example: 'AM' },
                    address: { type: 'string', example: '' },
                    emergencyContactName: { type: 'string', example: 'Marcella' },
                    emergencyContactPhone: { type: 'string', example: '(92) 9 9299-8524' },
                    bankName: { type: 'string', example: 'Inter' },
                    bankAgency: { type: 'string', example: '0001' },
                    bankAccount: { type: 'string', example: '20022213' },
                    bankAccountType: { type: 'string', example: 'Corrente' },
                    dependentsCount: { type: 'integer', example: 2 },
                    dependentsNotes: { type: 'string', example: '' }
                }
            },
            HrRequest: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'uuid' },
                    employeeId: { type: 'string', example: 'uuid' },
                    companyId: { type: 'string', example: 'uuid' },
                    clientId: { type: 'string', example: 'uuid' },
                    type: { type: 'string', example: 'ferias' },
                    status: { type: 'string', example: 'Solicitado' },
                    details: { type: 'object', example: { startDate: '2025-01-10', endDate: '2025-01-20' } }
                }
            },
            HrFeedback: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'uuid' },
                    targetId: { type: 'string', example: 'uuid' },
                    fieldName: { type: 'string', example: 'cpf' },
                    message: { type: 'string', example: 'CPF invalido' },
                    resolved: { type: 'boolean', example: false }
                }
            },
            HrWorksite: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'uuid' },
                    companyId: { type: 'string', example: 'uuid' },
                    name: { type: 'string', example: 'Posto 1' },
                    description: { type: 'string', example: 'Setor Administrativo' }
                }
            },
            HrEmployee: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'uuid' },
                    companyId: { type: 'string', example: 'uuid' },
                    workSiteId: { type: 'string', example: 'uuid' },
                    name: { type: 'string', example: 'GUTEMBERG BRITO FERREIRA' },
                    role: { type: 'string', example: 'Desenvolvedor 2' },
                    admissionDate: { type: 'string', example: '2025-12-20' },
                    status: { type: 'string', example: 'Ativo' },
                    salary: { type: 'number', example: 5000 },
                    cpf: { type: 'string', example: '98522884234' }
                }
            },
            TimeSheet: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'uuid' },
                    employeeId: { type: 'string', example: 'uuid' },
                    companyId: { type: 'string', example: 'uuid' },
                    periodStart: { type: 'string', example: '2025-12-01' },
                    periodEnd: { type: 'string', example: '2025-12-31' },
                    status: { type: 'string', example: 'Em Edicao' }
                }
            },
            TimeEntry: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'uuid' },
                    timeSheetId: { type: 'string', example: 'uuid' },
                    entryDate: { type: 'string', example: '2025-12-27' },
                    schedule: { type: 'string', example: '09:00-18:00' },
                    punches: { type: 'array', items: { type: 'string' }, example: ['09:00', '12:00', '13:00', '18:00'] },
                    situations: { type: 'array', items: { type: 'string' }, example: ['Trabalhando'] },
                    notes: { type: 'string', example: '' }
                }
            },
            TimeComment: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'uuid' },
                    timeEntryId: { type: 'string', example: 'uuid' },
                    authorId: { type: 'string', example: 'uuid' },
                    authorRole: { type: 'string', example: 'employee' },
                    message: { type: 'string', example: 'Esqueci de bater no horario.' },
                    createdAt: { type: 'string', example: '2025-12-27T13:00:00.000Z' }
                }
            },
            Payroll: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'uuid' },
                    employeeId: { type: 'string', example: 'uuid' },
                    companyId: { type: 'string', example: 'uuid' },
                    competence: { type: 'string', example: '2025-12' },
                    status: { type: 'string', example: 'Disponivel' }
                }
            },
            NotificationBulk: {
                type: 'object',
                properties: {
                    notifications: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', example: 'uuid' },
                                userId: { type: 'string', example: 'uuid' },
                                title: { type: 'string', example: 'Aviso' },
                                message: { type: 'string', example: 'Mensagem' },
                                timestamp: { type: 'string', example: '2025-12-20T12:00:00.000Z' }
                            }
                        }
                    }
                }
            },
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
            GenericSuccess: {
                type: 'object',
                properties: { success: { type: 'boolean', example: true } }
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
                tags: ['Health'],
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
                tags: ['Setup'],
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
                tags: ['Setup'],
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
                tags: ['Setup'],
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
                tags: ['Setup'],
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
                tags: ['Setup'],
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
                tags: ['Sync'],
                summary: 'Sincroniza dados principais',
                responses: {
                    200: {
                        description: 'Payload sync',
                        content: {
                            'application/json': {
                                schema: { type: 'object' },
                                examples: {
                                    default: {
                                        value: {
                                            companies: [],
                                            users: [],
                                            requestTypes: [],
                                            categories: [],
                                            requests: [],
                                            attachments: [],
                                            documents: [],
                                            chat: [],
                                            notifications: [],
                                            obligations: [],
                                            routines: [],
                                            workSites: [],
                                            employees: [],
                                            timeSheets: [],
                                            timeEntries: [],
                                            timeComments: [],
                                            payrolls: [],
                                            hrAdmissions: [],
                                            hrRequests: [],
                                            fieldFeedback: []
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/login': {
            post: {
                tags: ['Auth'],
                summary: 'Login (admin/cliente/funcionario)',
                description: 'Use o token retornado em Authorization: Bearer <token> nos endpoints protegidos.',
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
                tags: ['Companies'],
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
                tags: ['Companies'],
                summary: 'Remove empresa',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Removida', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/obligations': {
            post: {
                tags: ['Obligations'],
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
                tags: ['Obligations'],
                summary: 'Remove obrigacao',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Removida', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/monthly-routines': {
            post: {
                tags: ['Obligations'],
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
                tags: ['Uploads', 'Obligations'],
                summary: 'Upload de anexo de rotina mensal',
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    routineId: { type: 'string' },
                                    companyId: { type: 'string' },
                                    category: { type: 'string' },
                                    title: { type: 'string' },
                                    referenceDate: { type: 'string' },
                                    file: { type: 'string', format: 'binary' }
                                }
                            },
                            examples: {
                                default: {
                                    value: {
                                        routineId: 'uuid',
                                        companyId: 'uuid',
                                        category: 'Fiscal',
                                        title: 'Emissao de DAS - 2025-12',
                                        referenceDate: '2025-12-20'
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Arquivo salvo' },
                    400: { description: 'Dados invalidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, examples: { missing: { value: { error: 'Missing routine or category' } } } } } },
                    500: { description: 'Erro interno', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, examples: { server: { value: { error: 'Erro' } } } } } }
                }
            }
        },
        '/hr/admission': {
            post: {
                tags: ['HR'],
                summary: 'Cria/atualiza admissao',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/HrAdmissionRequest' } } } },
                responses: { 200: { description: 'Admissao salva', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/hr/request': {
            post: {
                tags: ['HR'],
                summary: 'Cria/atualiza solicitacao RH',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/HrRequest' } } } },
                responses: { 200: { description: 'Solicitacao salva', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/hr/feedback': {
            post: {
                tags: ['HR'],
                summary: 'Cria/atualiza feedback de campo RH',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/HrFeedback' } } } },
                responses: { 200: { description: 'Feedback salvo', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/hr/worksite': {
            post: {
                tags: ['HR'],
                summary: 'Cria posto/sector',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/HrWorksite' } } } },
                responses: { 200: { description: 'Posto salvo', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/hr/employee': {
            post: {
                tags: ['HR'],
                summary: 'Cria/atualiza funcionario',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/HrEmployee' } } } },
                responses: { 200: { description: 'Funcionario salvo', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/hr/time-sheet': {
            post: {
                tags: ['HR'],
                summary: 'Cria/atualiza folha de ponto',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TimeSheet' } } } },
                responses: { 200: { description: 'Folha salva', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/hr/time-entry': {
            post: {
                tags: ['HR'],
                summary: 'Cria/atualiza registro de ponto',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TimeEntry' } } } },
                responses: { 200: { description: 'Registro salvo', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/hr/time-comment': {
            post: {
                tags: ['HR'],
                summary: 'Adiciona comentario em ponto',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TimeComment' } } } },
                responses: { 200: { description: 'Comentario salvo', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/hr/time-approve': {
            post: {
                tags: ['HR'],
                summary: 'Aprova folha de ponto',
                requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', example: { timeSheetId: 'uuid', approvedBy: 'uuid' } } } } },
                responses: { 200: { description: 'Aprovada', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/hr/time-sign': {
            post: {
                tags: ['HR'],
                summary: 'Assina folha de ponto',
                requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', example: { timeSheetId: 'uuid' } } } } },
                responses: { 200: { description: 'Assinada', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/hr/payroll': {
            post: {
                tags: ['HR'],
                summary: 'Cria/atualiza holerite',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Payroll' } } } },
                responses: { 200: { description: 'Holerite salvo', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/hr/attachment': {
            post: {
                tags: ['Uploads', 'HR'],
                summary: 'Upload de anexo RH',
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    entityType: { type: 'string' },
                                    entityId: { type: 'string' },
                                    uploadedBy: { type: 'string' },
                                    name: { type: 'string' },
                                    file: { type: 'string', format: 'binary' }
                                }
                            },
                            examples: {
                                default: {
                                    value: {
                                        id: 'uuid',
                                        entityType: 'hr_request',
                                        entityId: 'uuid',
                                        uploadedBy: 'uuid',
                                        name: 'documento.pdf'
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Anexo salvo' },
                    400: { description: 'Arquivo ausente', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, examples: { missing: { value: { error: 'Arquivo nao enviado.' } } } } } },
                    500: { description: 'Erro interno', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, examples: { server: { value: { error: 'Erro' } } } } } }
                }
            }
        },
        '/hr/attachment/file/{id}': {
            get: {
                tags: ['Uploads', 'HR'],
                summary: 'Download de anexo RH',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Arquivo' } }
            }
        },
        '/notifications/read': {
            post: {
                tags: ['Notifications'],
                summary: 'Marca notificacao como lida',
                requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', example: { id: 'uuid' } } } } },
                responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/notifications': {
            post: {
                tags: ['Notifications'],
                summary: 'Cria/atualiza notificacoes',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/NotificationBulk' } } } },
                responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/notifications/{id}': {
            put: {
                tags: ['Notifications'],
                summary: 'Atualiza notificacao',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', example: { title: 'Titulo', message: 'Mensagem' } } } } },
                responses: { 200: { description: 'Atualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            },
            delete: {
                tags: ['Notifications'],
                summary: 'Remove notificacao',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Removida', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericSuccess' } } } } }
            }
        },
        '/cep/{cep}': {
            get: {
                tags: ['Misc'],
                summary: 'Consulta CEP',
                security: [],
                parameters: [{ name: 'cep', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Endereco' } }
            }
        },
        '/pix': {
            post: {
                tags: ['Misc'],
                summary: 'Gera cobranca PIX',
                security: [],
                requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
                responses: { 200: { description: 'PIX gerado' } }
            }
        },
        '/upload-cert': {
            post: {
                tags: ['Uploads', 'Misc'],
                summary: 'Upload de certificados PIX',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    crt: { type: 'string', format: 'binary' },
                                    key: { type: 'string', format: 'binary' }
                                }
                            },
                            examples: {
                                default: { value: { } }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Certificados salvos' },
                    500: { description: 'Erro interno', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, examples: { server: { value: { error: 'Erro' } } } } } }
                }
            }
        },
        '/uploads/presign': {
            post: {
                tags: ['Uploads'],
                summary: 'Gera URL presigned para upload em Spaces',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/PresignRequest' } } }
                },
                responses: {
                    200: { description: 'URL gerada', content: { 'application/json': { schema: { $ref: '#/components/schemas/PresignResponse' } } } },
                    400: { description: 'Dados invalidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, examples: { missing: { value: { error: 'Missing key or contentType' } } } } } },
                    500: { description: 'Erro interno', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, examples: { server: { value: { error: 'Spaces not configured' } } } } } }
                }
            }
        }
    }
};
