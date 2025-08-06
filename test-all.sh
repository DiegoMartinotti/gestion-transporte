#!/bin/bash

# Script para ejecutar todos los tests del proyecto
# Este script ejecuta tests unitarios, de integración y E2E

echo "========================================="
echo "  Ejecutando Suite Completa de Tests"
echo "========================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Función para ejecutar tests y capturar resultado
run_test() {
    local test_name=$1
    local test_command=$2
    local test_dir=$3
    
    echo -e "${YELLOW}→ Ejecutando: $test_name${NC}"
    echo "  Directorio: $test_dir"
    echo "  Comando: $test_command"
    echo ""
    
    cd $test_dir
    
    if eval $test_command; then
        echo -e "${GREEN}✓ $test_name: PASADO${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}✗ $test_name: FALLADO${NC}"
        ((FAILED_TESTS++))
    fi
    
    ((TOTAL_TESTS++))
    echo ""
    echo "-------------------------------------"
    echo ""
    
    cd - > /dev/null
}

# Verificar que los servidores están corriendo
echo "🔍 Verificando servicios..."
echo ""

# Verificar backend
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  El backend no está corriendo en el puerto 3001${NC}"
    echo "   Por favor, ejecuta 'npm run dev' en la carpeta backend"
    echo ""
fi

# Verificar frontend
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  El frontend no está corriendo en el puerto 3000${NC}"
    echo "   Por favor, ejecuta 'npm start' en la carpeta frontend"
    echo ""
fi

echo "========================================="
echo ""

# 1. Tests del Backend
echo "📦 BACKEND TESTS"
echo "=================="
echo ""

# Tests unitarios del backend
run_test "Backend - Tests Unitarios" \
    "npm run test:unit -- --silent" \
    "./backend"

# Tests de integración del backend
run_test "Backend - Tests de Integración" \
    "npm run test:integration -- --silent" \
    "./backend"

# 2. Tests del Frontend
echo "🎨 FRONTEND TESTS"
echo "=================="
echo ""

# Type checking
run_test "Frontend - Type Checking" \
    "npm run type-check" \
    "./frontend"

# Linting
run_test "Frontend - Linting" \
    "npm run lint" \
    "./frontend"

# Tests unitarios del frontend
run_test "Frontend - Tests Unitarios" \
    "npm run test -- --watchAll=false --silent" \
    "./frontend"

# 3. Tests E2E
echo "🌐 E2E TESTS"
echo "============"
echo ""

# Tests de regresión
run_test "E2E - Tests de Regresión" \
    "npm run test:regression -- --reporter=list" \
    "./frontend"

# Tests E2E completos
run_test "E2E - Suite Completa" \
    "npm run test:e2e -- --reporter=list" \
    "./frontend"

# Resumen
echo ""
echo "========================================="
echo "           RESUMEN DE TESTS"
echo "========================================="
echo ""
echo "Total de suites ejecutadas: $TOTAL_TESTS"
echo -e "${GREEN}✓ Pasadas: $PASSED_TESTS${NC}"
echo -e "${RED}✗ Falladas: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡Todos los tests pasaron exitosamente!${NC}"
    exit 0
else
    echo -e "${RED}❌ Algunos tests fallaron. Por favor revisa los errores arriba.${NC}"
    exit 1
fi