# Errores de TypeScript y ESLint agrupados por funcionalidad

Generado: 2025-09-05T19:15:03.531Z

Total de errores TS: 1
Total de issues ESLint: 106
Archivos con errores TS: 1
Archivos con issues ESLint: 33

## Componentes/Mapas

- ESLint (10)
  - `src/components/maps/MapView.old.tsx:242:16` - WARNING `max-lines-per-function`: Function 'MapView' has too many lines (109). Maximum allowed is 100
  - `src/components/maps/MapView.old.tsx:274:29` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/maps/MapViewHelpers.tsx:153:12` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/maps/MapViewHelpers.tsx:155:28` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/maps/MapViewHelpers.tsx:209:12` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/maps/MapViewHelpers.tsx:215:28` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/maps/RouteVisualizer/hooks/useRouteCalculation.ts:29:36` - WARNING `max-lines-per-function`: Arrow function has too many lines (115). Maximum allowed is 100
  - `src/components/maps/SiteMapHelpers.tsx:73:38` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/maps/SiteMapHelpers.tsx:88:28` - WARNING `@typescript-eslint/no-non-null-assertion`: Forbidden non-null assertion
  - `src/components/maps/SiteMapHelpers.tsx:88:56` - WARNING `@typescript-eslint/no-non-null-assertion`: Forbidden non-null assertion

## Componentes/Previsualización

- ESLint (4)
  - `src/components/preview/TarifaPreview.tsx:120:60` - WARNING `max-lines-per-function`: Arrow function has too many lines (308). Maximum allowed is 100
  - `src/components/preview/TarifaPreview.tsx:166:75` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/preview/TarifaPreview.tsx:212:6` - WARNING `react-hooks/exhaustive-deps`: React Hook useEffect has missing dependencies: 'previewMutation' and 'scenarios'. Either include them or remove the dependency array
  - `src/components/preview/TarifaPreview.tsx:439:1` - WARNING `max-lines`: File has too many lines (420). Maximum allowed is 400

## Componentes/Reportes

- ESLint (5)
  - `src/components/reports/components/ChartsTab.tsx:37:40` - WARNING `max-lines-per-function`: Arrow function has too many lines (117). Maximum allowed is 100
  - `src/components/reports/components/ReportHistoryTableRow.tsx:78:68` - WARNING `@typescript-eslint/no-non-null-assertion`: Forbidden non-null assertion
  - `src/components/reports/hooks/useReportHistoryState.ts:12:18` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/reports/ReportHistoryHelpers.tsx:161:64` - WARNING `@typescript-eslint/no-non-null-assertion`: Forbidden non-null assertion
  - `src/components/reports/ReportHistoryHelpers.tsx:165:64` - WARNING `@typescript-eslint/no-non-null-assertion`: Forbidden non-null assertion

## Componentes/Tablas

- ESLint (14)
  - `src/components/tables/DocumentacionTable/hooks/useDocumentosData.ts:22:60` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/tables/DocumentacionTable/hooks/useDocumentosData.ts:30:48` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/tables/DocumentacionTable/hooks/useDocumentosData.ts:45:16` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/tables/DocumentacionTable/hooks/useDocumentosData.ts:70:16` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/tables/DocumentacionTable/hooks/useDocumentosData.ts:94:16` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/tables/DocumentacionTable/hooks/useDocumentosData.ts:118:61` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/tables/DocumentacionTable/hooks/useDocumentosData.ts:141:22` - ERROR `sonarjs/prefer-immediate-return`: Immediately return this expression instead of assigning it to the temporary variable "documentos"
  - `src/components/tables/DocumentacionTable/hooks/useDocumentStats.ts:12:17` - ERROR `sonarjs/prefer-immediate-return`: Immediately return this expression instead of assigning it to the temporary variable "stats"
  - `src/components/tables/DocumentacionTable/hooks/useFilteredDocumentos.ts:10:30` - ERROR `sonarjs/prefer-immediate-return`: Immediately return this expression instead of assigning it to the temporary variable "filteredDocumentos"
  - `src/components/tables/DocumentTableComponents.tsx:194:41` - WARNING `@typescript-eslint/no-non-null-assertion`: Forbidden non-null assertion
  - `src/components/tables/FormulaHistorialTable.tsx:46:76` - WARNING `max-lines-per-function`: Arrow function has too many lines (310). Maximum allowed is 100
  - `src/components/tables/FormulaHistorialTable.tsx:65:6` - WARNING `react-hooks/exhaustive-deps`: React Hook useEffect has a missing dependency: 'loadFormulas'. Either include it or remove the dependency array
  - `src/components/tables/FormulaHistorialTable.tsx:99:21` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/tables/GenericDocumentTable/helpers.ts:53:24` - WARNING `max-params`: Arrow function has too many parameters (5). Maximum allowed is 4

## Componentes/Tarifa

- ESLint (6)
  - `src/components/tarifa/components/DetalleResultadoModal.tsx:20:69` - WARNING `max-lines-per-function`: Arrow function has too many lines (162). Maximum allowed is 100
  - `src/components/tarifa/components/DetalleResultadoModal.tsx:20:69` - ERROR `complexity`: Arrow function has a complexity of 11. Maximum allowed is 10
  - `src/components/tarifa/components/EscenarioFormModal.tsx:42:63` - WARNING `max-lines-per-function`: Arrow function has too many lines (128). Maximum allowed is 100
  - `src/components/tarifa/components/EscenarioModal.tsx:34:55` - WARNING `max-lines-per-function`: Arrow function has too many lines (121). Maximum allowed is 100
  - `src/components/tarifa/components/EscenariosTable.tsx:31:57` - WARNING `max-lines-per-function`: Arrow function has too many lines (102). Maximum allowed is 100
  - `src/components/tarifa/components/VariablesPanel.tsx:13:55` - WARNING `max-lines-per-function`: Arrow function has too many lines (127). Maximum allowed is 100

## Componentes/Tarjetas

- ESLint (1)
  - `src/components/cards/PersonalCard.tsx:446:1` - WARNING `max-lines`: File has too many lines (434). Maximum allowed is 400

## Componentes/Validators

- ESLint (42)
  - `src/components/validators/DocumentValidatorGeneric.tsx:257:9` - WARNING `@typescript-eslint/no-non-null-assertion`: Forbidden non-null assertion
  - `src/components/validators/DocumentValidatorGeneric.tsx:290:9` - ERROR `sonarjs/no-duplicate-string`: Define a constant instead of duplicating this literal 3 times
  - `src/components/validators/DocumentValidatorGeneric.tsx:318:84` - ERROR `sonarjs/no-duplicate-string`: Define a constant instead of duplicating this literal 4 times
  - `src/components/validators/DocumentValidatorGeneric.tsx:343:9` - ERROR `sonarjs/no-duplicate-string`: Define a constant instead of duplicating this literal 3 times
  - `src/components/validators/DocumentValidatorGeneric.tsx:352:28` - ERROR `@typescript-eslint/no-unused-vars`: 'config' is defined but never used. Allowed unused args must match /^\_/u
  - `src/components/validators/DocumentValidatorGeneric.tsx:400:9` - ERROR `sonarjs/no-duplicate-string`: Define a constant instead of duplicating this literal 3 times
  - `src/components/validators/DocumentValidatorGeneric.tsx:479:1` - WARNING `max-lines`: File has too many lines (849). Maximum allowed is 400
  - `src/components/validators/DocumentValidatorGeneric.tsx:513:79` - ERROR `complexity`: Arrow function has a complexity of 11. Maximum allowed is 10
  - `src/components/validators/DocumentValidatorGeneric.tsx:577:75` - WARNING `max-lines-per-function`: Arrow function has too many lines (360). Maximum allowed is 100
  - `src/components/validators/DocumentValidatorGeneric.tsx:600:10` - ERROR `@typescript-eslint/no-unused-vars`: '\_detailsOpened' is assigned a value but never used
  - `src/components/validators/DocumentValidatorGeneric.tsx:600:36` - ERROR `@typescript-eslint/no-unused-vars`: '\_toggleDetails' is assigned a value but never used
  - `src/components/validators/DocumentValidatorGeneric.tsx:614:24` - ERROR `@typescript-eslint/no-unused-vars`: '\_validationResults' is assigned a value but never used
  - `src/components/validators/DocumentValidatorGeneric.tsx:616:20` - ERROR `@typescript-eslint/no-unused-vars`: '\_runValidation' is assigned a value but never used
  - `src/components/validators/ExampleValidatorUsage.tsx:38:13` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/validators/ExampleValidatorUsage.tsx:39:11` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/validators/ExampleValidatorUsage.tsx:42:15` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/validators/ExampleValidatorUsage.tsx:43:14` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/validators/ExampleValidatorUsage.tsx:124:34` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/validators/ExampleValidatorUsage.tsx:140:33` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/validators/ExampleValidatorUsage.tsx:158:12` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/validators/ExampleValidatorUsage.tsx:250:80` - ERROR `complexity`: Arrow function has a complexity of 12. Maximum allowed is 10
  - `src/components/validators/ExampleValidatorUsage.tsx:254:3` - ERROR `@typescript-eslint/no-unused-vars`: 'showDetails' is assigned a value but never used
  - `src/components/validators/ExampleValidatorUsage.tsx:255:3` - ERROR `@typescript-eslint/no-unused-vars`: 'readonly' is assigned a value but never used
  - `src/components/validators/ExampleValidatorUsage.tsx:259:5` - ERROR `@typescript-eslint/no-unused-vars`: 'validationResults' is assigned a value but never used
  - `src/components/validators/ExampleValidatorUsage.tsx:261:5` - ERROR `@typescript-eslint/no-unused-vars`: 'validationRules' is assigned a value but never used
  - `src/components/validators/ExampleValidatorUsage.tsx:271:46` - ERROR `sonarjs/no-duplicate-string`: Define a constant instead of duplicating this literal 3 times
  - `src/components/validators/ExampleValidatorUsage.tsx:352:24` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/validators/ExampleValidatorUsage.tsx:353:34` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/validators/ExampleValidatorUsage.tsx:357:5` - ERROR `@typescript-eslint/no-unused-vars`: 'validationResults' is assigned a value but never used
  - `src/components/validators/ExampleValidatorUsage.tsx:359:5` - ERROR `@typescript-eslint/no-unused-vars`: 'runValidation' is assigned a value but never used
  - `src/components/validators/ExampleValidatorUsage.tsx:392:5` - ERROR `@typescript-eslint/no-unused-vars`: 'validationResults' is assigned a value but never used
  - `src/components/validators/ExampleValidatorUsage.tsx:394:5` - ERROR `@typescript-eslint/no-unused-vars`: 'runValidation' is assigned a value but never used
  - `src/components/validators/ExampleValidatorUsage.tsx:460:35` - ERROR `sonarjs/no-duplicate-string`: Define a constant instead of duplicating this literal 4 times
  - `src/components/validators/ExampleValidatorUsage.tsx:481:1` - WARNING `max-lines`: File has too many lines (434). Maximum allowed is 400
  - `src/components/validators/ViajeValidator.tsx:125:54` - WARNING `@typescript-eslint/no-non-null-assertion`: Forbidden non-null assertion
  - `src/components/validators/ViajeValidator.tsx:172:41` - WARNING `@typescript-eslint/no-non-null-assertion`: Forbidden non-null assertion
  - `src/components/validators/ViajeValidator.tsx:234:28` - WARNING `@typescript-eslint/no-non-null-assertion`: Forbidden non-null assertion
  - `src/components/validators/ViajeValidator.tsx:265:39` - WARNING `@typescript-eslint/no-non-null-assertion`: Forbidden non-null assertion
  - `src/components/validators/ViajeValidator.tsx:309:63` - WARNING `@typescript-eslint/no-non-null-assertion`: Forbidden non-null assertion
  - `src/components/validators/ViajeValidator.tsx:369:62` - WARNING `max-lines-per-function`: Arrow function has too many lines (233). Maximum allowed is 100
  - `src/components/validators/ViajeValidator.tsx:369:62` - ERROR `complexity`: Arrow function has a complexity of 13. Maximum allowed is 10
  - `src/components/validators/ViajeValidator.tsx:436:1` - WARNING `max-lines`: File has too many lines (573). Maximum allowed is 400

## Componentes/Viajes

- ESLint (18)
  - `src/components/viajes/ConfigurationPreview/VehicleDetailsSection.tsx:30:8` - WARNING `max-lines-per-function`: Function 'VehicleDetailsSection' has too many lines (143). Maximum allowed is 100
  - `src/components/viajes/ConfigurationPreview/VehicleDetailsSection.tsx:69:32` - ERROR `complexity`: Arrow function has a complexity of 15. Maximum allowed is 10
  - `src/components/viajes/VehicleTypeDetector.tsx:10:3` - ERROR `@typescript-eslint/no-unused-vars`: 'NumberInput' is defined but never used
  - `src/components/viajes/VehicleTypeDetector.tsx:13:3` - ERROR `@typescript-eslint/no-unused-vars`: 'ActionIcon' is defined but never used
  - `src/components/viajes/VehicleTypeDetector.tsx:14:3` - ERROR `@typescript-eslint/no-unused-vars`: 'Tooltip' is defined but never used
  - `src/components/viajes/VehicleTypeDetector.tsx:16:3` - ERROR `@typescript-eslint/no-unused-vars`: 'Box' is defined but never used
  - `src/components/viajes/VehicleTypeDetector.tsx:19:3` - ERROR `@typescript-eslint/no-unused-vars`: 'IconTruck' is defined but never used
  - `src/components/viajes/VehicleTypeDetector.tsx:20:3` - ERROR `@typescript-eslint/no-unused-vars`: 'IconScale' is defined but never used
  - `src/components/viajes/VehicleTypeDetector.tsx:21:3` - ERROR `@typescript-eslint/no-unused-vars`: 'IconRuler' is defined but never used
  - `src/components/viajes/VehicleTypeDetector.tsx:22:3` - ERROR `@typescript-eslint/no-unused-vars`: 'IconUsers' is defined but never used
  - `src/components/viajes/VehicleTypeDetector.tsx:83:8` - WARNING `max-lines-per-function`: Function 'VehicleTypeDetector' has too many lines (338). Maximum allowed is 100
  - `src/components/viajes/VehicleTypeDetector.tsx:83:8` - ERROR `complexity`: Function 'VehicleTypeDetector' has a complexity of 11. Maximum allowed is 10
  - `src/components/viajes/VehicleTypeDetector.tsx:98:6` - WARNING `react-hooks/exhaustive-deps`: React Hook useEffect has a missing dependency: 'performDetection'. Either include it or remove the dependency array
  - `src/components/viajes/VehicleTypeDetector.tsx:127:26` - ERROR `complexity`: Arrow function has a complexity of 18. Maximum allowed is 10
  - `src/components/viajes/VehicleTypeDetector.tsx:127:31` - ERROR `sonarjs/cognitive-complexity`: Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed
  - `src/components/viajes/VehicleTypeDetector.tsx:457:1` - WARNING `max-lines`: File has too many lines (414). Maximum allowed is 400
  - `src/components/viajes/VehiculoAssigner/AssignmentCard.tsx:14:11` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type
  - `src/components/viajes/ViajeCard/ViajeCardContent.tsx:9:29` - WARNING `@typescript-eslint/no-explicit-any`: Unexpected any. Specify a different type

## Constantes

- ESLint (1)
  - `src/constants/vehiculos.tsx:144:42` - WARNING `@typescript-eslint/no-non-null-assertion`: Forbidden non-null assertion

## Contextos

- ESLint (2)
  - `src/contexts/EntityNamesContext.tsx:20:14` - WARNING `@typescript-eslint/no-non-null-assertion`: Forbidden non-null assertion
  - `src/contexts/EntityNamesContext.tsx:36:14` - WARNING `@typescript-eslint/no-non-null-assertion`: Forbidden non-null assertion

## Hooks/CalculatorBase

- ESLint (1)
  - `src/hooks/useCalculatorBase.ts:239:8` - WARNING `max-lines-per-function`: Function 'useCalculatorBase' has too many lines (122). Maximum allowed is 100

## Hooks/TarifaManager

- ESLint (1)
  - `src/hooks/useTarifaManager.ts:44:33` - WARNING `max-lines-per-function`: Arrow function has too many lines (144). Maximum allowed is 100

## Páginas/Viajes

- TypeScript (1)
  - `src/pages/viajes/ViajeFormOriginal.tsx:59:1` - `TS1128`: Declaration or statement expected.
- ESLint (1)
  - `src/pages/viajes/ViajeFormOriginal.tsx:59:0` - ERROR `expected`: Parsing error: Declaration or statement
