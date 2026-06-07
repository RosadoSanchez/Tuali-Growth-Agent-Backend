# Tuali Growth Agent Backend

Backend para un agente inteligente de ventas basado en datos transaccionales de Tuali.

El objetivo del proyecto es centralizar información de pedidos y productos para generar métricas, análisis e insights que puedan ser consumidos por un agente conversacional (ElevenLabs u otros sistemas de IA).

---

# Objetivo

Construir una API capaz de:

- Consultar pedidos y detalles de pedidos.
- Generar métricas de negocio.
- Identificar tendencias de venta.
- Detectar oportunidades de crecimiento.
- Servir como fuente de conocimiento para un agente de ventas impulsado por IA.

---

# Tecnologías

- Node.js
- Express
- MongoDB Atlas
- Mongoose
- dotenv
- cors

---

# Estructura del Proyecto

```text
src/
│
├── models/
│   ├── Order.js
│   └── OrderDetail.js
│
├── routes/
│   ├── orders.js
│   ├── orderDetails.js
│   ├── analytics.js
│   └── customers.js
│
├── db.js
└── server.js
```

---

# Base de Datos

Actualmente se utilizan dos colecciones principales.

## Orders

Contiene información general de cada pedido.

Ejemplo:

```json
{
  "id_pedido": "8959920000000000000",
  "customer_id": "2598790000000000000",
  "pais": "México",
  "status_final": "Entregado",
  "SubTotal": "1367.21",
  "Total": "1585.96"
}
```

## OrderDetails

Contiene los productos asociados a cada pedido.

Ejemplo:

```json
{
  "id_linea": "22363559",
  "id_pedido": "9221880000000000000",
  "sku_solicitado": "417641000000000000",
  "nombre_sku_solicitado": "Leche Saborizada Toni Frutilla",
  "Quantity": "12",
  "Status": "Entregado"
}
```

---

# Estado Actual de los Datos

## Orders

- ~68,000 pedidos

## OrderDetails

- ~1,016,000 líneas de pedido

---

# API Endpoints

## Orders

### Obtener pedidos

```http
GET /api/orders
```

Retorna pedidos paginados.

### Obtener pedido por ID

```http
GET /api/orders/:id_pedido
```

---

## Order Details

### Obtener líneas de pedido

```http
GET /api/order-details
```

Retorna líneas de pedido paginadas.

### Obtener productos de un pedido

```http
GET /api/order-details/:id_pedido
```

Retorna todos los productos asociados a un pedido.

---

# Analytics

## Top productos vendidos

```http
GET /api/analytics/top-products
```

Obtiene los productos más vendidos por cantidad.

Ejemplo:

```json
[
  {
    "_id": "Coca-Cola 600ml",
    "totalSold": 25421
  }
]
```

---

## Top clientes

```http
GET /api/analytics/top-customers
```

Obtiene los clientes con mayor facturación acumulada.

Ejemplo:

```json
[
  {
    "_id": "2598790000000000000",
    "totalSpent": 125430.21
  }
]
```

---

## Productos de baja rotación

```http
GET /api/analytics/low-sales-products
```

Obtiene los productos menos vendidos.

---

## Distribución por estatus

```http
GET /api/analytics/status
```

Muestra el número de pedidos por estatus.

Ejemplo:

```json
[
  {
    "_id": "Entregado",
    "count": 14523
  }
]
```

---

# Customers

Estos endpoints construyen un perfil comercial del cliente para alimentar agentes inteligentes.

---

## ID's de todos los clientes

```http
GET /api/customers/ids
```

## Perfil completo de cliente

```http
GET /api/customers/:customerId/profile
```

Genera un resumen estructurado del historial de compras.

Incluye:

- Total de pedidos
- Total invertido
- Último pedido
- Estatus de pedidos
- Productos favoritos

Ejemplo:

```json
{
  "success": true,
  "customerId": "2598790000000000000",
  "totalOrders": 52,
  "totalSpent": 125430.21,
  "lastOrder": {
    "id_pedido": "9221880000000000000",
    "status_final": "Entregado"
  },
  "statusBreakdown": {
    "Entregado": 50,
    "Cancelado": 2
  },
  "favoriteProducts": [
    {
      "product": "Coca-Cola",
      "quantity": 421
    }
  ]
}
```

---

## Insights automáticos de cliente

```http
GET /api/customers/:customerId/insights
```

Genera una respuesta lista para ser utilizada por un agente de IA.

Ejemplo:

```json
{
  "success": true,
  "customerId": "2598790000000000000",
  "metrics": {
    "totalOrders": 52,
    "totalSpent": 125430.21,
    "deliveryRate": 98.1,
    "topProducts": [
      "Coca-Cola",
      "Fuze Tea",
      "Sprite"
    ]
  },
  "summary": "Este cliente ha realizado 52 pedidos por un total de $125430.21. Compra principalmente Coca-Cola, Fuze Tea y Sprite. Su último pedido fue entregado correctamente. El 98% de sus pedidos han sido entregados exitosamente."
}
```

---

# Casos de Uso del Agente

La API está diseñada para responder preguntas comerciales como:

- ¿Qué productos compra más este cliente?
- ¿Cuánto ha gastado históricamente?
- ¿Cuál fue su último pedido?
- ¿Qué clientes generan más ingresos?
- ¿Qué productos tienen baja rotación?
- ¿Qué oportunidades de venta existen?

---

# Integración con ElevenLabs

La arquitectura fue diseñada para que ElevenLabs consulte directamente esta API.

## Flujo esperado

```text
Usuario
   ↓
ElevenLabs Voice Agent
   ↓
API Tuali Growth Agent
   ↓
MongoDB Atlas
   ↓
Respuesta enriquecida
   ↓
ElevenLabs TTS
```

---

## Endpoint Planeado

```http
POST /api/agent/query
```

Ejemplo:

```json
{
  "question": "¿Cómo va el cliente 2598790000000000000?"
}
```

Respuesta:

```json
{
  "answer": "Este cliente ha realizado 52 pedidos por un total de $125,430. Compra principalmente Coca-Cola y Fuze Tea. Su último pedido fue entregado correctamente y no presenta señales de abandono."
}
```

---

# Instalación

Clonar repositorio:

```bash
git clone https://github.com/RosadoSanchez/Tuali-Growth-Agent-Backend.git
```

Entrar al proyecto:

```bash
cd Tuali-Growth-Agent-Backend
```

Instalar dependencias:

```bash
npm install
```

Instalar dependencias de desarrollo:

```bash
npm install -D nodemon
npm install node-fetch
npm install twilio
```

Crear archivo `.env`

```env
PORT=3000
MONGO_URI=mongodb+srv://...
```

Ejecutar servidor:

```bash
npm run dev
```

---

# Variables de Entorno

```env
PORT=3000
MONGO_URI=mongodb+srv://...
```

---

# Roadmap

## Fase 1 — API Base

- [x] Conexión a MongoDB Atlas
- [x] Importación masiva de CSV
- [x] Colección Orders
- [x] Colección OrderDetails
- [x] Endpoints CRUD
- [x] Endpoints analíticos
- [x] Perfil de cliente
- [x] Insights automáticos

## Fase 2 — AI Sales Agent

- [ ] Endpoint `/api/agent/query`
- [ ] Integración OpenAI
- [ ] Integración ElevenLabs
- [ ] Generación automática de insights
- [ ] Herramientas para Voice Agent

## Fase 3 — Growth Intelligence

- [ ] Recomendaciones de productos
- [ ] Predicción de ventas
- [ ] Alertas automáticas
- [ ] Detección de abandono
- [ ] Cross-selling
- [ ] Upselling

---

# Autor

Valeria Rosado

Proyecto desarrollado para la construcción de un Growth Agent basado en datos de ventas y comportamiento de clientes.