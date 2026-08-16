import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, Wallet, PieChart, Tags, ChevronLeft, ChevronRight,
  ArrowUpRight, ArrowDownRight, Trash2, X, Check, Receipt
} from "lucide-react";

// ---------------------------------------------------------------------------
// Modelo de datos
// Transacción: { id, fecha (ISO), tipo: 'ingreso'|'egreso', categoria,
//                detalle, valor (number), recurrencia }
// Categoría:   { id, nombre, tipo: 'ingreso'|'egreso' }
// ---------------------------------------------------------------------------

const CATS_DEFAULT = [
  { id: "salario", nombre: "Salario / Quincena", tipo: "ingreso" },
  { id: "otros_ing", nombre: "Otros ingresos", tipo: "ingreso" },
  { id: "alimentacion", nombre: "Alimentación", tipo: "egreso" },
  { id: "moto", nombre: "Moto", tipo: "egreso" },
  { id: "carro", nombre: "Carro", tipo: "egreso" },
  { id: "vivienda", nombre: "Vivienda / Servicios", tipo: "egreso" },
  { id: "deuda", nombre: "Deudas / Tarjetas", tipo: "egreso" },
  { id: "diarios", nombre: "Gastos diarios", tipo: "egreso" },
  { id: "ahorro", nombre: "Ahorro", tipo: "egreso" },
  { id: "otros_egr", nombre: "Otros gastos", tipo: "egreso" },
];

const RECURRENCIAS = ["Único", "Eventual", "Recurrente"];

// Datos migrados desde PRESUPUESTO_2026.xlsx (formato compacto: f=fecha, ti=tipo i/e,
// c=categoria, d=detalle, v=valor, r=recurrencia U/E/R). Nota: las fechas 2025-xx de
// "alimentacion" vienen así rotuladas en la hoja original ALIMENTACION del Excel.
const SEED_RAW = [{f:"2026-12-23",ti:"i",c:"salario",d:"Basico (Quincena 01)",v:2548130.0,r:"R"},{f:"2026-12-23",ti:"i",c:"salario",d:"Rodamiento(Quincena 01)",v:1456074.0,r:"R"},{f:"2026-12-23",ti:"i",c:"salario",d:"-Salud/Pensión/Cooserpack",v:203850.0,r:"R"},{f:"2026-12-23",ti:"i",c:"salario",d:"-Cooserpack",v:14200.0,r:"R"},{f:"2026-12-23",ti:"i",c:"salario",d:"Sub Quincena 01",v:3786154.0,r:"R"},{f:"2026-12-23",ti:"i",c:"salario",d:"Basico(Quincena 15)",v:2548130.0,r:"R"},{f:"2026-12-23",ti:"i",c:"salario",d:"Propinas(Quincena 15)",v:1550000.0,r:"R"},{f:"2026-12-23",ti:"i",c:"salario",d:"Prima/Bono/otro ingreso",v:4757750.0,r:"R"},{f:"2026-12-23",ti:"i",c:"salario",d:"Sub Quincena 15",v:8855880.0,r:"R"},{f:"2026-12-23",ti:"i",c:"salario",d:"Total Salario",v:12642034.0,r:"R"},{f:"2026-12-23",ti:"i",c:"salario",d:"Total Renta Disponible",v:12642034.0,r:"R"},{f:"2026-12-16",ti:"e",c:"alimentacion",d:"Alimentación",v:600000.0,r:"E"},{f:"2026-12-01",ti:"e",c:"alimentacion",d:"Alimentación",v:1200000.0,r:"E"},{f:"2026-12-01",ti:"e",c:"moto",d:"Parqueo moto",v:30000.0,r:"E"},{f:"2026-12-01",ti:"e",c:"carro",d:"Parqueo Carro",v:42000.0,r:"E"},{f:"2026-11-23",ti:"i",c:"salario",d:"Basico (Quincena 01)",v:2548130.0,r:"R"},{f:"2026-11-23",ti:"i",c:"salario",d:"Rodamiento(Quincena 01)",v:1456074.0,r:"R"},{f:"2026-11-23",ti:"i",c:"salario",d:"-Salud/Pensión/Cooserpack",v:203850.0,r:"R"},{f:"2026-11-23",ti:"i",c:"salario",d:"-Cooserpack",v:14200.0,r:"R"},{f:"2026-11-23",ti:"i",c:"salario",d:"Sub Quincena 01",v:3786154.0,r:"R"},{f:"2026-11-23",ti:"i",c:"salario",d:"Basico(Quincena 15)",v:2548130.0,r:"R"},{f:"2026-11-23",ti:"i",c:"salario",d:"Propinas(Quincena 15)",v:1550000.0,r:"R"},{f:"2026-11-23",ti:"i",c:"salario",d:"Sub Quincena 15",v:4098130.0,r:"R"},{f:"2026-11-23",ti:"i",c:"salario",d:"Total Salario",v:7884284.0,r:"R"},{f:"2026-11-23",ti:"i",c:"salario",d:"Total Renta Disponible",v:7884284.0,r:"R"},{f:"2026-11-16",ti:"e",c:"alimentacion",d:"Alimentación",v:600000.0,r:"E"},{f:"2026-11-01",ti:"e",c:"alimentacion",d:"Alimentación",v:1200000.0,r:"E"},{f:"2026-11-01",ti:"e",c:"moto",d:"Parqueo moto",v:30000.0,r:"E"},{f:"2026-11-01",ti:"e",c:"carro",d:"Parqueo Carro",v:42000.0,r:"E"},{f:"2026-10-23",ti:"i",c:"salario",d:"Basico (Quincena 01)",v:2548130.0,r:"R"},{f:"2026-10-23",ti:"i",c:"salario",d:"Rodamiento(Quincena 01)",v:1456074.0,r:"R"},{f:"2026-10-23",ti:"i",c:"salario",d:"-Salud/Pensión/Cooserpack",v:203850.0,r:"R"},{f:"2026-10-23",ti:"i",c:"salario",d:"-Cooserpack",v:14200.0,r:"R"},{f:"2026-10-23",ti:"i",c:"salario",d:"Sub Quincena 01",v:3786154.0,r:"R"},{f:"2026-10-23",ti:"i",c:"salario",d:"Basico(Quincena 15)",v:2548130.0,r:"R"},{f:"2026-10-23",ti:"i",c:"salario",d:"Propinas(Quincena 15)",v:1550000.0,r:"R"},{f:"2026-10-23",ti:"i",c:"salario",d:"Sub Quincena 15",v:4098130.0,r:"R"},{f:"2026-10-23",ti:"i",c:"salario",d:"Total Salario",v:7884284.0,r:"R"},{f:"2026-10-23",ti:"i",c:"salario",d:"Total Renta Disponible",v:7884284.0,r:"R"},{f:"2026-10-16",ti:"e",c:"alimentacion",d:"Alimentación",v:600000.0,r:"E"},{f:"2026-10-01",ti:"e",c:"alimentacion",d:"Alimentación",v:1200000.0,r:"E"},{f:"2026-10-01",ti:"e",c:"moto",d:"Parqueo moto",v:30000.0,r:"E"},{f:"2026-10-01",ti:"e",c:"carro",d:"Parqueo Carro",v:42000.0,r:"E"},{f:"2026-09-23",ti:"i",c:"salario",d:"Basico (Quincena 01)",v:2548130.0,r:"R"},{f:"2026-09-23",ti:"i",c:"salario",d:"Rodamiento(Quincena 01)",v:1456074.0,r:"R"},{f:"2026-09-23",ti:"i",c:"salario",d:"-Salud/Pensión/Cooserpack",v:203850.0,r:"R"},{f:"2026-09-23",ti:"i",c:"salario",d:"-Cooserpack",v:14200.0,r:"R"},{f:"2026-09-23",ti:"i",c:"salario",d:"Sub Quincena 01",v:3786154.0,r:"R"},{f:"2026-09-23",ti:"i",c:"salario",d:"Basico(Quincena 15)",v:2548130.0,r:"R"},{f:"2026-09-23",ti:"i",c:"salario",d:"Propinas(Quincena 15)",v:1550000.0,r:"R"},{f:"2026-09-23",ti:"i",c:"salario",d:"Sub Quincena 15",v:4098130.0,r:"R"},{f:"2026-09-23",ti:"i",c:"salario",d:"Total Salario",v:7884284.0,r:"R"},{f:"2026-09-23",ti:"i",c:"salario",d:"Total Renta Disponible",v:7884284.0,r:"R"},{f:"2026-09-16",ti:"e",c:"alimentacion",d:"Alimentación",v:600000.0,r:"E"},{f:"2026-09-01",ti:"e",c:"alimentacion",d:"Alimentación",v:1200000.0,r:"E"},{f:"2026-09-01",ti:"e",c:"moto",d:"Parqueo moto",v:30000.0,r:"E"},{f:"2026-09-01",ti:"e",c:"carro",d:"Parqueo Carro",v:42000.0,r:"E"},{f:"2026-08-23",ti:"i",c:"salario",d:"Basico (Quincena 01)",v:2548130.0,r:"R"},{f:"2026-08-23",ti:"i",c:"salario",d:"Rodamiento(Quincena 01)",v:1456074.0,r:"R"},{f:"2026-08-23",ti:"i",c:"salario",d:"Uso Rappi card",v:121300.0,r:"R"},{f:"2026-08-23",ti:"i",c:"salario",d:"Otros Ingresos(Q 01)",v:655000.0,r:"R"},{f:"2026-08-23",ti:"i",c:"salario",d:"-Salud/Pensión/Cooserpack",v:203850.0,r:"R"},{f:"2026-08-23",ti:"i",c:"salario",d:"-Cooserpack",v:14200.0,r:"R"},{f:"2026-08-23",ti:"i",c:"salario",d:"Sub Quincena 01",v:4562454.0,r:"R"},{f:"2026-08-23",ti:"i",c:"salario",d:"Basico(Quincena 15)",v:2548130.0,r:"R"},{f:"2026-08-23",ti:"i",c:"salario",d:"Propinas(Quincena 15)",v:1550000.0,r:"R"},{f:"2026-08-23",ti:"i",c:"salario",d:"Sub Quincena 15",v:4098130.0,r:"R"},{f:"2026-08-23",ti:"i",c:"salario",d:"Total Salario",v:7884284.0,r:"R"},{f:"2026-08-23",ti:"i",c:"salario",d:"Uso Credito",v:121300.0,r:"R"},{f:"2026-08-23",ti:"i",c:"salario",d:"Otros Ingresos(No salario)",v:655000.0,r:"R"},{f:"2026-08-23",ti:"i",c:"salario",d:"Total Renta Disponible",v:8660584.0,r:"R"},{f:"2026-08-16",ti:"e",c:"alimentacion",d:"Alimentación",v:600000.0,r:"E"},{f:"2026-08-13",ti:"e",c:"diarios",d:"Tostao",v:21300.0,r:"E"},{f:"2026-08-13",ti:"e",c:"diarios",d:"Gasto diario",v:21300.0,r:"E"},{f:"2026-08-11",ti:"e",c:"diarios",d:"Pañales ",v:65600.0,r:"E"},{f:"2026-08-11",ti:"e",c:"alimentacion",d:"Alimentación",v:15000.0,r:"E"},{f:"2026-08-11",ti:"e",c:"diarios",d:"Gasto diario",v:65600.0,r:"E"},{f:"2026-08-09",ti:"e",c:"diarios",d:"Salida Cine",v:135100.0,r:"E"},{f:"2026-08-09",ti:"e",c:"diarios",d:"Gasto diario",v:135100.0,r:"E"},{f:"2026-08-08",ti:"e",c:"diarios",d:"Agua y guantes ",v:14400.0,r:"E"},{f:"2026-08-08",ti:"e",c:"alimentacion",d:"Alimentación",v:103300.0,r:"E"},{f:"2026-08-08",ti:"e",c:"diarios",d:"Gasto diario",v:14400.0,r:"E"},{f:"2026-08-07",ti:"e",c:"alimentacion",d:"Alimentación",v:10000.0,r:"E"},{f:"2026-08-06",ti:"e",c:"diarios",d:"Mecato Taller moto",v:10300.0,r:"E"},{f:"2026-08-06",ti:"e",c:"alimentacion",d:"Alimentación",v:100000.0,r:"E"},{f:"2026-08-06",ti:"e",c:"diarios",d:"Gasto diario",v:10300.0,r:"E"},{f:"2026-08-06",ti:"e",c:"moto",d:"Gasolina",v:44238.0,r:"E"},{f:"2026-08-06",ti:"e",c:"moto",d:"Aceite de motor",v:40000.0,r:"E"},{f:"2026-08-06",ti:"e",c:"moto",d:"Otros gastos",v:37000.0,r:"E"},{f:"2026-08-02",ti:"e",c:"diarios",d:"Ecoparque",v:164000.0,r:"E"},{f:"2026-08-02",ti:"e",c:"diarios",d:"Ecoparque",v:179550.0,r:"E"},{f:"2026-08-02",ti:"e",c:"diarios",d:"Ecoparque",v:10000.0,r:"E"},{f:"2026-08-02",ti:"e",c:"diarios",d:"Gasto diario",v:353550.0,r:"E"},{f:"2026-08-01",ti:"e",c:"diarios",d:"Ecoparque",v:325020.0,r:"E"},{f:"2026-08-01",ti:"e",c:"diarios",d:"Peaje",v:64800.0,r:"E"},{f:"2026-08-01",ti:"e",c:"alimentacion",d:"Alimentación",v:353984.0,r:"E"},{f:"2026-08-01",ti:"e",c:"diarios",d:"Gasto diario",v:389820.0,r:"E"},{f:"2026-08-01",ti:"e",c:"moto",d:"Parqueo moto",v:30000.0,r:"E"},{f:"2026-08-01",ti:"e",c:"carro",d:"Parqueo Carro",v:42000.0,r:"E"},{f:"2026-07-31",ti:"e",c:"diarios",d:"Plata a mamá",v:50000.0,r:"E"},{f:"2026-07-31",ti:"e",c:"diarios",d:"Loza Osaki 118",v:103000.0,r:"E"},{f:"2026-07-31",ti:"e",c:"diarios",d:"Ecoparque",v:139293.0,r:"E"},{f:"2026-07-31",ti:"e",c:"diarios",d:"Gasto diario",v:292293.0,r:"E"},{f:"2026-07-30",ti:"e",c:"diarios",d:"Avena y Almojabana",v:8500.0,r:"E"},{f:"2026-07-30",ti:"e",c:"alimentacion",d:"Alimentación",v:30000.0,r:"E"},{f:"2026-07-30",ti:"e",c:"diarios",d:"Gasto diario",v:8500.0,r:"E"},{f:"2026-07-30",ti:"e",c:"moto",d:"Parqueo moto",v:14000.0,r:"E"},{f:"2026-07-29",ti:"e",c:"alimentacion",d:"Alimentación",v:205433.0,r:"E"},{f:"2026-07-29",ti:"e",c:"moto",d:"Gasolina",v:40000.0,r:"E"},{f:"2026-07-29",ti:"e",c:"carro",d:"Gasolina",v:100000.0,r:"E"},{f:"2026-07-29",ti:"e",c:"carro",d:"Parqueo Carro",v:9500.0,r:"E"},{f:"2026-07-28",ti:"e",c:"diarios",d:"Carro Cindy reclamar cedula",v:20000.0,r:"Ú"},{f:"2026-07-28",ti:"e",c:"diarios",d:"Gasto diario",v:20000.0,r:"E"},{f:"2026-07-27",ti:"e",c:"diarios",d:"Arepa con carne",v:9000.0,r:"E"},{f:"2026-07-27",ti:"e",c:"diarios",d:"Gasto diario",v:9000.0,r:"E"},{f:"2026-07-27",ti:"e",c:"moto",d:"Otros gastos",v:20000.0,r:"E"},{f:"2026-07-25",ti:"e",c:"alimentacion",d:"Alimentación",v:93810.0,r:"E"},{f:"2026-07-25",ti:"e",c:"diarios",d:"Gasto diario",v:96900.0,r:"E"},{f:"2026-07-24",ti:"e",c:"alimentacion",d:"Alimentación",v:8000.0,r:"E"},{f:"2026-07-24",ti:"e",c:"diarios",d:"Gasto diario",v:74000.0,r:"E"},{f:"2026-07-23",ti:"e",c:"alimentacion",d:"Alimentación",v:100000.0,r:"E"},{f:"2026-07-23",ti:"i",c:"salario",d:"Basico (Quincena 01)",v:2548130.0,r:"R"},{f:"2026-07-23",ti:"i",c:"salario",d:"Rodamiento(Quincena 01)",v:1456074.0,r:"R"},{f:"2026-07-23",ti:"i",c:"salario",d:"Prima/Bono/otro ingreso",v:2557750.0,r:"R"},{f:"2026-07-23",ti:"i",c:"salario",d:"Uso Rappi card",v:13000000.0,r:"R"},{f:"2026-07-23",ti:"i",c:"salario",d:"Otros Ingresos(Q 01)",v:655000.0,r:"R"},{f:"2026-07-23",ti:"i",c:"salario",d:"-Salud/Pensión/Cooserpack",v:203850.0,r:"R"},{f:"2026-07-23",ti:"i",c:"salario",d:"-Cooserpack",v:14200.0,r:"R"},{f:"2026-07-23",ti:"i",c:"salario",d:"Sub Quincena 01",v:19998904.0,r:"R"},{f:"2026-07-23",ti:"i",c:"salario",d:"Basico(Quincena 15)",v:2548130.0,r:"R"},{f:"2026-07-23",ti:"i",c:"salario",d:"Propinas(Quincena 15)",v:1617543.0,r:"R"},{f:"2026-07-23",ti:"i",c:"salario",d:"Uso Rappi card",v:89000.0,r:"R"},{f:"2026-07-23",ti:"i",c:"salario",d:"Otros Ingresos(Q 15)",v:2800000.0,r:"R"},{f:"2026-07-23",ti:"i",c:"salario",d:"-Salud/Pensión",v:203850.0,r:"R"},{f:"2026-07-23",ti:"i",c:"salario",d:"Sub Quincena 15",v:6850823.0,r:"R"},{f:"2026-07-23",ti:"i",c:"salario",d:"Total Salario",v:10305727.0,r:"R"},{f:"2026-07-23",ti:"i",c:"salario",d:"Uso Credito",v:13089000.0,r:"R"},{f:"2026-07-23",ti:"i",c:"salario",d:"Otros Ingresos(No salario)",v:3455000.0,r:"R"},{f:"2026-07-23",ti:"i",c:"salario",d:"Total Renta Disponible",v:26849727.0,r:"R"},{f:"2026-07-22",ti:"e",c:"diarios",d:"Gasto diario",v:21260.0,r:"E"},{f:"2026-07-21",ti:"e",c:"diarios",d:"Gasto diario",v:122400.0,r:"E"},{f:"2026-07-21",ti:"e",c:"moto",d:"Gasolina",v:50000.0,r:"E"},{f:"2026-07-21",ti:"e",c:"moto",d:"Otros gastos",v:450000.0,r:"E"},{f:"2026-07-20",ti:"e",c:"diarios",d:"Gasto diario",v:1759590.0,r:"E"},{f:"2026-07-20",ti:"e",c:"carro",d:"Parqueo Carro",v:28600.0,r:"E"},{f:"2026-07-18",ti:"e",c:"alimentacion",d:"Alimentación",v:26000.0,r:"E"},{f:"2026-07-17",ti:"e",c:"diarios",d:"Gasto diario",v:34250.0,r:"E"},{f:"2026-07-16",ti:"e",c:"alimentacion",d:"Alimentación",v:245400.0,r:"E"},{f:"2026-07-16",ti:"e",c:"diarios",d:"Gasto diario",v:292100.0,r:"E"},{f:"2026-07-16",ti:"e",c:"moto",d:"Gasolina",v:40000.0,r:"E"},{f:"2026-07-15",ti:"e",c:"diarios",d:"Gasto diario",v:22800.0,r:"E"},{f:"2026-07-14",ti:"e",c:"diarios",d:"Gasto diario",v:70000.0,r:"E"},{f:"2026-07-12",ti:"e",c:"alimentacion",d:"Alimentación",v:30500.0,r:"E"},{f:"2026-07-12",ti:"e",c:"carro",d:"Gasolina",v:50000.0,r:"E"},{f:"2026-07-11",ti:"e",c:"alimentacion",d:"Alimentación",v:399310.0,r:"E"},{f:"2026-07-10",ti:"e",c:"alimentacion",d:"Alimentación",v:50000.0,r:"E"},{f:"2026-07-10",ti:"e",c:"diarios",d:"Gasto diario",v:500400.0,r:"E"},{f:"2026-07-09",ti:"e",c:"alimentacion",d:"Alimentación",v:50000.0,r:"E"},{f:"2026-07-09",ti:"e",c:"diarios",d:"Gasto diario",v:18900.0,r:"E"},{f:"2026-07-09",ti:"e",c:"moto",d:"Gasolina",v:40000.0,r:"E"},{f:"2026-07-08",ti:"e",c:"alimentacion",d:"Alimentación",v:110000.0,r:"E"},{f:"2026-07-08",ti:"e",c:"diarios",d:"Gasto diario",v:125000.0,r:"E"},{f:"2026-07-07",ti:"e",c:"alimentacion",d:"Alimentación",v:20000.0,r:"E"},{f:"2026-07-07",ti:"e",c:"diarios",d:"Gasto diario",v:817100.0,r:"E"},{f:"2026-07-05",ti:"e",c:"alimentacion",d:"Alimentación",v:50000.0,r:"E"},{f:"2026-07-05",ti:"e",c:"diarios",d:"Gasto diario",v:74000.0,r:"E"},{f:"2026-07-05",ti:"e",c:"carro",d:"Otros gastos",v:304000.0,r:"E"},{f:"2026-07-04",ti:"e",c:"alimentacion",d:"Alimentación",v:684263.0,r:"E"},{f:"2026-07-04",ti:"e",c:"diarios",d:"Gasto diario",v:85000.0,r:"E"},{f:"2026-07-03",ti:"e",c:"diarios",d:"Gasto diario",v:300000.0,r:"E"},{f:"2026-07-02",ti:"e",c:"alimentacion",d:"Alimentación",v:295332.0,r:"E"},{f:"2026-07-02",ti:"e",c:"diarios",d:"Gasto diario",v:11763100.0,r:"E"},{f:"2026-07-02",ti:"e",c:"moto",d:"Parqueo moto",v:10000.0,r:"E"},{f:"2026-07-01",ti:"e",c:"alimentacion",d:"Alimentación",v:47600.0,r:"E"},{f:"2026-07-01",ti:"e",c:"diarios",d:"Gasto diario",v:28000.0,r:"E"},{f:"2026-07-01",ti:"e",c:"moto",d:"Gasolina",v:40000.0,r:"E"},{f:"2026-07-01",ti:"e",c:"moto",d:"Parqueo moto",v:30000.0,r:"E"},{f:"2026-07-01",ti:"e",c:"carro",d:"Parqueo Carro",v:42000.0,r:"E"},{f:"2026-06-30",ti:"e",c:"diarios",d:"Gasto diario",v:151900.0,r:"E"},{f:"2026-06-30",ti:"e",c:"moto",d:"Parqueo moto",v:10000.0,r:"E"},{f:"2026-06-28",ti:"e",c:"diarios",d:"Gasto diario",v:206210.0,r:"E"},{f:"2026-06-27",ti:"e",c:"alimentacion",d:"Alimentación",v:82400.0,r:"E"},{f:"2026-06-26",ti:"e",c:"alimentacion",d:"Alimentación",v:34200.0,r:"E"},{f:"2026-06-26",ti:"e",c:"diarios",d:"Gasto diario",v:81160.0,r:"E"},{f:"2026-06-26",ti:"e",c:"moto",d:"Gasolina",v:15000.0,r:"E"},{f:"2026-06-25",ti:"e",c:"alimentacion",d:"Alimentación",v:107300.0,r:"E"},{f:"2026-06-25",ti:"e",c:"diarios",d:"Gasto diario",v:91700.0,r:"E"},{f:"2026-06-24",ti:"e",c:"alimentacion",d:"Alimentación",v:10000.0,r:"E"},{f:"2026-06-24",ti:"e",c:"moto",d:"Parqueo moto",v:10000.0,r:"E"},{f:"2026-06-23",ti:"i",c:"salario",d:"Basico (Quincena 01)",v:2548130.0,r:"R"},{f:"2026-06-23",ti:"i",c:"salario",d:"Rodamiento(Quincena 01)",v:1456074.0,r:"R"},{f:"2026-06-23",ti:"i",c:"salario",d:"Uso Rappi card",v:257900.0,r:"R"},{f:"2026-06-23",ti:"i",c:"salario",d:"Otros Ingresos(Q 01)",v:655000.0,r:"R"},{f:"2026-06-23",ti:"i",c:"salario",d:"-Salud/Pensión/Cooserpack",v:203850.0,r:"R"},{f:"2026-06-23",ti:"i",c:"salario",d:"-Cooserpack",v:14200.0,r:"R"},{f:"2026-06-23",ti:"i",c:"salario",d:"Sub Quincena 01",v:4699054.0,r:"R"},{f:"2026-06-23",ti:"i",c:"salario",d:"Basico(Quincena 15)",v:2548130.0,r:"R"},{f:"2026-06-23",ti:"i",c:"salario",d:"Propinas(Quincena 15)",v:1975293.0,r:"R"},{f:"2026-06-23",ti:"i",c:"salario",d:"Uso Rappi card",v:22800.0,r:"R"},{f:"2026-06-23",ti:"i",c:"salario",d:"-Salud/Pensión",v:203850.0,r:"R"},{f:"2026-06-23",ti:"i",c:"salario",d:"Sub Quincena 15",v:4342373.0,r:"R"},{f:"2026-06-23",ti:"i",c:"salario",d:"Total Salario",v:8105727.0,r:"R"},{f:"2026-06-23",ti:"i",c:"salario",d:"Uso Credito",v:280700.0,r:"R"},{f:"2026-06-23",ti:"i",c:"salario",d:"Otros Ingresos(No salario)",v:655000.0,r:"R"},{f:"2026-06-23",ti:"i",c:"salario",d:"Total Renta Disponible",v:9041427.0,r:"R"},{f:"2026-06-22",ti:"e",c:"alimentacion",d:"Alimentación",v:65809.0,r:"E"},{f:"2026-06-22",ti:"e",c:"diarios",d:"Gasto diario",v:22800.0,r:"E"},{f:"2026-06-22",ti:"e",c:"moto",d:"Parqueo moto",v:10000.0,r:"E"},{f:"2026-06-21",ti:"e",c:"diarios",d:"Gasto diario",v:33500.0,r:"E"},{f:"2026-06-21",ti:"e",c:"carro",d:"Gasolina",v:50000.0,r:"E"},{f:"2026-06-20",ti:"e",c:"alimentacion",d:"Alimentación",v:87000.0,r:"E"},{f:"2026-06-19",ti:"e",c:"diarios",d:"Gasto diario",v:23250.0,r:"E"},{f:"2026-06-19",ti:"e",c:"moto",d:"Gasolina",v:40000.0,r:"E"},{f:"2026-06-18",ti:"e",c:"moto",d:"Parqueo moto",v:10000.0,r:"E"},{f:"2026-06-17",ti:"e",c:"diarios",d:"Gasto diario",v:120000.0,r:"E"},{f:"2026-06-16",ti:"e",c:"alimentacion",d:"Alimentación",v:406408.0,r:"E"},{f:"2026-06-16",ti:"e",c:"diarios",d:"Gasto diario",v:134920.0,r:"E"},{f:"2026-06-16",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-06-15",ti:"e",c:"alimentacion",d:"Alimentación",v:26000.0,r:"E"},{f:"2026-06-14",ti:"e",c:"diarios",d:"Gasto diario",v:257900.0,r:"E"},{f:"2026-06-14",ti:"e",c:"carro",d:"Otros gastos",v:10000.0,r:"E"},{f:"2026-06-13",ti:"e",c:"diarios",d:"Gasto diario",v:650000.0,r:"E"},{f:"2026-06-13",ti:"e",c:"carro",d:"Gasolina",v:100000.0,r:"E"},{f:"2026-06-09",ti:"e",c:"alimentacion",d:"Alimentación",v:19000.0,r:"E"},{f:"2026-06-09",ti:"e",c:"diarios",d:"Gasto diario",v:13800.0,r:"E"},{f:"2026-06-08",ti:"e",c:"diarios",d:"Gasto diario",v:25000.0,r:"E"},{f:"2026-06-08",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-06-07",ti:"e",c:"alimentacion",d:"Alimentación",v:19900.0,r:"E"},{f:"2026-06-06",ti:"e",c:"alimentacion",d:"Alimentación",v:29000.0,r:"E"},{f:"2026-06-06",ti:"e",c:"diarios",d:"Gasto diario",v:78000.0,r:"E"},{f:"2026-06-05",ti:"e",c:"alimentacion",d:"Alimentación",v:49200.0,r:"E"},{f:"2026-06-05",ti:"e",c:"diarios",d:"Gasto diario",v:38800.0,r:"E"},{f:"2026-06-04",ti:"e",c:"alimentacion",d:"Alimentación",v:77800.0,r:"E"},{f:"2026-06-04",ti:"e",c:"diarios",d:"Gasto diario",v:10000.0,r:"E"},{f:"2026-06-04",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-06-03",ti:"e",c:"alimentacion",d:"Alimentación",v:20000.0,r:"E"},{f:"2026-06-03",ti:"e",c:"diarios",d:"Gasto diario",v:65900.0,r:"E"},{f:"2026-06-03",ti:"e",c:"moto",d:"Gasolina",v:50000.0,r:"E"},{f:"2026-06-03",ti:"e",c:"moto",d:"Parqueo moto",v:13000.0,r:"E"},{f:"2026-06-01",ti:"e",c:"alimentacion",d:"Alimentación",v:531936.0,r:"E"},{f:"2026-06-01",ti:"e",c:"diarios",d:"Gasto diario",v:299800.0,r:"E"},{f:"2026-06-01",ti:"e",c:"moto",d:"Gasolina",v:20000.0,r:"E"},{f:"2026-06-01",ti:"e",c:"moto",d:"Parqueo moto",v:38000.0,r:"E"},{f:"2026-06-01",ti:"e",c:"carro",d:"Parqueo Carro",v:42000.0,r:"E"},{f:"2026-05-29",ti:"e",c:"diarios",d:"Gasto diario",v:2039725.0,r:"E"},{f:"2026-05-28",ti:"e",c:"alimentacion",d:"Alimentación",v:28000.0,r:"E"},{f:"2026-05-28",ti:"e",c:"diarios",d:"Gasto diario",v:52000.0,r:"E"},{f:"2026-05-27",ti:"e",c:"alimentacion",d:"Alimentación",v:38600.0,r:"E"},{f:"2026-05-27",ti:"e",c:"diarios",d:"Gasto diario",v:18000.0,r:"E"},{f:"2026-05-27",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-05-25",ti:"e",c:"alimentacion",d:"Alimentación",v:50000.0,r:"E"},{f:"2026-05-25",ti:"e",c:"moto",d:"Gasolina",v:40000.0,r:"E"},{f:"2026-05-25",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-05-23",ti:"e",c:"alimentacion",d:"Alimentación",v:257700.0,r:"E"},{f:"2026-05-23",ti:"e",c:"diarios",d:"Gasto diario",v:62900.0,r:"E"},{f:"2026-05-23",ti:"e",c:"moto",d:"Parqueo moto",v:10000.0,r:"E"},{f:"2026-05-23",ti:"i",c:"salario",d:"Basico (Quincena 01)",v:2548130.0,r:"R"},{f:"2026-05-23",ti:"i",c:"salario",d:"Rodamiento(Quincena 01)",v:1456074.0,r:"R"},{f:"2026-05-23",ti:"i",c:"salario",d:"Otros Ingresos(Q 01)",v:2039725.0,r:"R"},{f:"2026-05-23",ti:"i",c:"salario",d:"-Salud/Pensión/Cooserpack",v:203850.0,r:"R"},{f:"2026-05-23",ti:"i",c:"salario",d:"-Cooserpack",v:14200.0,r:"R"},{f:"2026-05-23",ti:"i",c:"salario",d:"Sub Quincena 01",v:5825879.0,r:"R"},{f:"2026-05-23",ti:"i",c:"salario",d:"Basico(Quincena 15)",v:2548130.0,r:"R"},{f:"2026-05-23",ti:"i",c:"salario",d:"Propinas(Quincena 15)",v:1659829.0,r:"R"},{f:"2026-05-23",ti:"i",c:"salario",d:"Uso NU",v:1200000.0,r:"R"},{f:"2026-05-23",ti:"i",c:"salario",d:"-Salud/Pensión",v:203850.0,r:"R"},{f:"2026-05-23",ti:"i",c:"salario",d:"Sub Quincena 15",v:5204109.0,r:"R"},{f:"2026-05-23",ti:"i",c:"salario",d:"Total Salario",v:7790263.0,r:"R"},{f:"2026-05-23",ti:"i",c:"salario",d:"Uso Credito",v:1200000.0,r:"R"},{f:"2026-05-23",ti:"i",c:"salario",d:"Otros Ingresos(No salario)",v:2039725.0,r:"R"},{f:"2026-05-23",ti:"i",c:"salario",d:"Total Renta Disponible",v:11029988.0,r:"R"},{f:"2026-05-22",ti:"e",c:"alimentacion",d:"Alimentación",v:56840.0,r:"E"},{f:"2026-05-22",ti:"e",c:"diarios",d:"Gasto diario",v:25200.0,r:"E"},{f:"2026-05-21",ti:"e",c:"alimentacion",d:"Alimentación",v:25000.0,r:"E"},{f:"2026-05-19",ti:"e",c:"alimentacion",d:"Alimentación",v:20000.0,r:"E"},{f:"2026-05-19",ti:"e",c:"moto",d:"Gasolina",v:40000.0,r:"E"},{f:"2026-05-18",ti:"e",c:"alimentacion",d:"Alimentación",v:202620.0,r:"E"},{f:"2026-05-17",ti:"e",c:"alimentacion",d:"Alimentación",v:227000.0,r:"E"},{f:"2026-05-17",ti:"e",c:"diarios",d:"Gasto diario",v:147100.0,r:"E"},{f:"2026-05-16",ti:"e",c:"alimentacion",d:"Alimentación",v:126500.0,r:"E"},{f:"2026-05-16",ti:"e",c:"diarios",d:"Gasto diario",v:50000.0,r:"E"},{f:"2026-05-16",ti:"e",c:"carro",d:"Gasolina",v:70000.0,r:"E"},{f:"2026-05-16",ti:"e",c:"carro",d:"Parqueo Carro",v:22700.0,r:"E"},{f:"2026-05-15",ti:"e",c:"moto",d:"Gasolina",v:20000.0,r:"E"},{f:"2026-05-13",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-05-11",ti:"e",c:"alimentacion",d:"Alimentación",v:90800.0,r:"E"},{f:"2026-05-11",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-05-10",ti:"e",c:"alimentacion",d:"Alimentación",v:147120.0,r:"E"},{f:"2026-05-09",ti:"e",c:"alimentacion",d:"Alimentación",v:84000.0,r:"E"},{f:"2026-05-08",ti:"e",c:"moto",d:"Gasolina",v:40000.0,r:"E"},{f:"2026-05-08",ti:"e",c:"moto",d:"Parqueo moto",v:10000.0,r:"E"},{f:"2026-05-07",ti:"e",c:"diarios",d:"Gasto diario",v:15600.0,r:"E"},{f:"2026-05-06",ti:"e",c:"alimentacion",d:"Alimentación",v:20900.0,r:"E"},{f:"2026-05-06",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-05-05",ti:"e",c:"alimentacion",d:"Alimentación",v:34050.0,r:"E"},{f:"2026-05-04",ti:"e",c:"alimentacion",d:"Alimentación",v:26590.0,r:"E"},{f:"2026-05-04",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-05-03",ti:"e",c:"alimentacion",d:"Alimentación",v:40000.0,r:"E"},{f:"2026-05-03",ti:"e",c:"diarios",d:"Gasto diario",v:273043.0,r:"E"},{f:"2026-05-03",ti:"e",c:"carro",d:"Parqueo Carro",v:5000.0,r:"E"},{f:"2026-05-02",ti:"e",c:"alimentacion",d:"Alimentación",v:358200.0,r:"E"},{f:"2026-05-01",ti:"e",c:"alimentacion",d:"Alimentación",v:462550.0,r:"E"},{f:"2026-05-01",ti:"e",c:"diarios",d:"Gasto diario",v:67000.0,r:"E"},{f:"2026-05-01",ti:"e",c:"moto",d:"Parqueo moto",v:30000.0,r:"E"},{f:"2026-05-01",ti:"e",c:"carro",d:"Parqueo Carro",v:42000.0,r:"E"},{f:"2026-04-30",ti:"e",c:"alimentacion",d:"Alimentación",v:144160.0,r:"E"},{f:"2026-04-29",ti:"e",c:"diarios",d:"Gasto diario",v:638500.0,r:"E"},{f:"2026-04-29",ti:"e",c:"moto",d:"Gasolina",v:40000.0,r:"E"},{f:"2026-04-28",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-04-27",ti:"e",c:"alimentacion",d:"Alimentación",v:33450.0,r:"E"},{f:"2026-04-26",ti:"e",c:"alimentacion",d:"Alimentación",v:40000.0,r:"E"},{f:"2026-04-24",ti:"e",c:"alimentacion",d:"Alimentación",v:78200.0,r:"E"},{f:"2026-04-23",ti:"e",c:"alimentacion",d:"Alimentación",v:102000.0,r:"E"},{f:"2026-04-23",ti:"i",c:"salario",d:"Basico (Quincena 01)",v:2548130.0,r:"R"},{f:"2026-04-23",ti:"i",c:"salario",d:"Rodamiento(Quincena 01)",v:1456074.0,r:"R"},{f:"2026-04-23",ti:"i",c:"salario",d:"-Salud/Pensión/Cooserpack",v:203850.0,r:"R"},{f:"2026-04-23",ti:"i",c:"salario",d:"-Cooserpack",v:14200.0,r:"R"},{f:"2026-04-23",ti:"i",c:"salario",d:"Sub Quincena 01",v:3786154.0,r:"R"},{f:"2026-04-23",ti:"i",c:"salario",d:"Basico(Quincena 15)",v:2548130.0,r:"R"},{f:"2026-04-23",ti:"i",c:"salario",d:"Propinas(Quincena 15)",v:1710470.0,r:"R"},{f:"2026-04-23",ti:"i",c:"salario",d:"-Salud/Pensión",v:203850.0,r:"R"},{f:"2026-04-23",ti:"i",c:"salario",d:"Sub Quincena 15",v:4054750.0,r:"R"},{f:"2026-04-23",ti:"i",c:"salario",d:"Total Salario",v:7840904.0,r:"R"},{f:"2026-04-23",ti:"i",c:"salario",d:"Total Renta Disponible",v:7840904.0,r:"R"},{f:"2026-04-22",ti:"e",c:"alimentacion",d:"Alimentación",v:150000.0,r:"E"},{f:"2026-04-22",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-04-21",ti:"e",c:"alimentacion",d:"Alimentación",v:200000.0,r:"E"},{f:"2026-04-21",ti:"e",c:"moto",d:"Gasolina",v:40000.0,r:"E"},{f:"2026-04-20",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-04-18",ti:"e",c:"diarios",d:"Gasto diario",v:159000.0,r:"E"},{f:"2026-04-18",ti:"e",c:"carro",d:"Parqueo Carro",v:25000.0,r:"E"},{f:"2026-04-17",ti:"e",c:"carro",d:"Gasolina",v:50000.0,r:"E"},{f:"2026-04-17",ti:"e",c:"carro",d:"Parqueo Carro",v:31500.0,r:"E"},{f:"2026-04-16",ti:"e",c:"diarios",d:"Gasto diario",v:10000.0,r:"E"},{f:"2026-04-16",ti:"e",c:"moto",d:"Gasolina",v:20000.0,r:"E"},{f:"2026-04-16",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-04-15",ti:"e",c:"alimentacion",d:"Alimentación",v:159800.0,r:"E"},{f:"2026-04-15",ti:"e",c:"carro",d:"Gasolina",v:50000.0,r:"E"},{f:"2026-04-14",ti:"e",c:"moto",d:"Parqueo moto",v:16000.0,r:"E"},{f:"2026-04-11",ti:"e",c:"alimentacion",d:"Alimentación",v:200000.0,r:"E"},{f:"2026-04-09",ti:"e",c:"alimentacion",d:"Alimentación",v:70000.0,r:"E"},{f:"2026-04-09",ti:"e",c:"moto",d:"Otros gastos",v:47000.0,r:"E"},{f:"2026-04-08",ti:"e",c:"moto",d:"Gasolina",v:30000.0,r:"E"},{f:"2026-04-08",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-04-06",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-04-03",ti:"e",c:"alimentacion",d:"Alimentación",v:747700.0,r:"E"},{f:"2026-04-03",ti:"e",c:"moto",d:"Gasolina",v:40000.0,r:"E"},{f:"2026-04-02",ti:"e",c:"alimentacion",d:"Alimentación",v:66900.0,r:"E"},{f:"2026-04-01",ti:"e",c:"moto",d:"Parqueo moto",v:30000.0,r:"E"},{f:"2026-04-01",ti:"e",c:"carro",d:"Parqueo Carro",v:42000.0,r:"E"},{f:"2026-03-31",ti:"e",c:"alimentacion",d:"Alimentación",v:75000.0,r:"E"},{f:"2026-03-29",ti:"e",c:"alimentacion",d:"Alimentación",v:15000.0,r:"E"},{f:"2026-03-28",ti:"e",c:"moto",d:"Gasolina",v:15000.0,r:"E"},{f:"2026-03-28",ti:"e",c:"moto",d:"Aceite de motor",v:37000.0,r:"E"},{f:"2026-03-28",ti:"e",c:"moto",d:"Otros gastos",v:511300.0,r:"E"},{f:"2026-03-27",ti:"e",c:"moto",d:"Gasolina",v:20000.0,r:"E"},{f:"2026-03-27",ti:"e",c:"moto",d:"Parqueo moto",v:11100.0,r:"E"},{f:"2026-03-26",ti:"e",c:"diarios",d:"Gasto diario",v:14000.0,r:"E"},{f:"2026-03-25",ti:"e",c:"alimentacion",d:"Alimentación",v:50000.0,r:"E"},{f:"2026-03-25",ti:"e",c:"diarios",d:"Gasto diario",v:140000.0,r:"E"},{f:"2026-03-24",ti:"e",c:"alimentacion",d:"Alimentación",v:119800.0,r:"E"},{f:"2026-03-24",ti:"e",c:"moto",d:"Parqueo moto",v:11800.0,r:"E"},{f:"2026-03-23",ti:"e",c:"diarios",d:"Gasto diario",v:154000.0,r:"E"},{f:"2026-03-23",ti:"i",c:"salario",d:"Basico (Quincena 01)",v:2548130.0,r:"R"},{f:"2026-03-23",ti:"i",c:"salario",d:"Rodamiento(Quincena 01)",v:1549618.0,r:"R"},{f:"2026-03-23",ti:"i",c:"salario",d:"Prima/Bono/otro ingreso",v:491108.0,r:"R"},{f:"2026-03-23",ti:"i",c:"salario",d:"-Salud/Pensión/Cooserpack",v:243140.0,r:"R"},{f:"2026-03-23",ti:"i",c:"salario",d:"-Cooserpack",v:14200.0,r:"R"},{f:"2026-03-23",ti:"i",c:"salario",d:"Sub Quincena 01",v:4331516.0,r:"R"},{f:"2026-03-23",ti:"i",c:"salario",d:"Basico(Quincena 15)",v:2548130.0,r:"R"},{f:"2026-03-23",ti:"i",c:"salario",d:"Propinas(Quincena 15)",v:1703629.0,r:"R"},{f:"2026-03-23",ti:"i",c:"salario",d:"-Salud/Pensión",v:203850.0,r:"R"},{f:"2026-03-23",ti:"i",c:"salario",d:"Sub Quincena 15",v:4047909.0,r:"R"},{f:"2026-03-23",ti:"i",c:"salario",d:"Total Salario",v:8379425.0,r:"R"},{f:"2026-03-23",ti:"i",c:"salario",d:"Total Renta Disponible",v:8379425.0,r:"R"},{f:"2026-03-22",ti:"e",c:"alimentacion",d:"Alimentación",v:26500.0,r:"E"},{f:"2026-03-21",ti:"e",c:"diarios",d:"Gasto diario",v:244000.0,r:"E"},{f:"2026-03-21",ti:"e",c:"carro",d:"Parqueo Carro",v:43000.0,r:"E"},{f:"2026-03-20",ti:"e",c:"diarios",d:"Gasto diario",v:16768.0,r:"E"},{f:"2026-03-19",ti:"e",c:"alimentacion",d:"Alimentación",v:11000.0,r:"E"},{f:"2026-03-19",ti:"e",c:"diarios",d:"Gasto diario",v:50000.0,r:"E"},{f:"2026-03-19",ti:"e",c:"moto",d:"Parqueo moto",v:7500.0,r:"E"},{f:"2026-03-18",ti:"e",c:"alimentacion",d:"Alimentación",v:123650.0,r:"E"},{f:"2026-03-18",ti:"e",c:"diarios",d:"Gasto diario",v:104000.0,r:"E"},{f:"2026-03-17",ti:"e",c:"alimentacion",d:"Alimentación",v:56500.0,r:"E"},{f:"2026-03-17",ti:"e",c:"moto",d:"Gasolina",v:50000.0,r:"E"},{f:"2026-03-16",ti:"e",c:"alimentacion",d:"Alimentación",v:476000.0,r:"E"},{f:"2026-03-15",ti:"e",c:"alimentacion",d:"Alimentación",v:9000.0,r:"E"},{f:"2026-03-14",ti:"e",c:"alimentacion",d:"Alimentación",v:186800.0,r:"E"},{f:"2026-03-13",ti:"e",c:"alimentacion",d:"Alimentación",v:26900.0,r:"E"},{f:"2026-03-13",ti:"e",c:"moto",d:"Parqueo moto",v:7300.0,r:"E"},{f:"2026-03-12",ti:"e",c:"alimentacion",d:"Alimentación",v:23000.0,r:"E"},{f:"2026-03-12",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-03-11",ti:"e",c:"alimentacion",d:"Alimentación",v:50000.0,r:"E"},{f:"2026-03-11",ti:"e",c:"diarios",d:"Gasto diario",v:212750.0,r:"E"},{f:"2026-03-11",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-03-09",ti:"e",c:"alimentacion",d:"Alimentación",v:55000.0,r:"E"},{f:"2026-03-09",ti:"e",c:"diarios",d:"Gasto diario",v:50000.0,r:"E"},{f:"2026-03-09",ti:"e",c:"moto",d:"Gasolina",v:50000.0,r:"E"},{f:"2026-03-09",ti:"e",c:"moto",d:"Parqueo moto",v:9500.0,r:"E"},{f:"2026-03-08",ti:"e",c:"alimentacion",d:"Alimentación",v:200000.0,r:"E"},{f:"2026-03-08",ti:"e",c:"carro",d:"Parqueo Carro",v:24600.0,r:"E"},{f:"2026-03-07",ti:"e",c:"alimentacion",d:"Alimentación",v:103000.0,r:"E"},{f:"2026-03-06",ti:"e",c:"diarios",d:"Gasto diario",v:46000.0,r:"E"},{f:"2026-03-05",ti:"e",c:"alimentacion",d:"Alimentación",v:29000.0,r:"E"},{f:"2026-03-04",ti:"e",c:"alimentacion",d:"Alimentación",v:142000.0,r:"E"},{f:"2026-03-04",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-03-03",ti:"e",c:"alimentacion",d:"Alimentación",v:304151.0,r:"E"},{f:"2026-03-02",ti:"e",c:"alimentacion",d:"Alimentación",v:30000.0,r:"E"},{f:"2026-03-01",ti:"e",c:"moto",d:"Parqueo moto",v:30000.0,r:"E"},{f:"2026-03-01",ti:"e",c:"carro",d:"Parqueo Carro",v:42000.0,r:"E"},{f:"2026-02-26",ti:"e",c:"diarios",d:"Gasto diario",v:48000.0,r:"E"},{f:"2026-02-26",ti:"e",c:"moto",d:"Gasolina",v:50000.0,r:"E"},{f:"2026-02-26",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-02-25",ti:"e",c:"alimentacion",d:"Alimentación",v:68000.0,r:"E"},{f:"2026-02-25",ti:"e",c:"carro",d:"Gasolina",v:70000.0,r:"E"},{f:"2026-02-25",ti:"e",c:"carro",d:"Parqueo Carro",v:33000.0,r:"E"},{f:"2026-02-24",ti:"e",c:"alimentacion",d:"Alimentación",v:70000.0,r:"E"},{f:"2026-02-24",ti:"e",c:"diarios",d:"Gasto diario",v:50000.0,r:"E"},{f:"2026-02-24",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-02-23",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-02-23",ti:"i",c:"salario",d:"Basico (Quincena 01)",v:2442145.0,r:"R"},{f:"2026-02-23",ti:"i",c:"salario",d:"Rodamiento(Quincena 01)",v:1477964.0,r:"R"},{f:"2026-02-23",ti:"i",c:"salario",d:"Prima/Bono/otro ingreso",v:584960.0,r:"R"},{f:"2026-02-23",ti:"i",c:"salario",d:"Otros Ingresos(Q 01)",v:1938479.0,r:"R"},{f:"2026-02-23",ti:"i",c:"salario",d:"-Salud/Pensión/Cooserpack",v:216758.0,r:"R"},{f:"2026-02-23",ti:"i",c:"salario",d:"-Cooserpack",v:14200.0,r:"R"},{f:"2026-02-23",ti:"i",c:"salario",d:"Sub Quincena 01",v:6212590.0,r:"R"},{f:"2026-02-23",ti:"i",c:"salario",d:"Basico(Quincena 15)",v:2384428.0,r:"R"},{f:"2026-02-23",ti:"i",c:"salario",d:"Propinas(Quincena 15)",v:1585562.0,r:"R"},{f:"2026-02-23",ti:"i",c:"salario",d:"-Salud/Pensión",v:190754.0,r:"R"},{f:"2026-02-23",ti:"i",c:"salario",d:"Sub Quincena 15",v:3779236.0,r:"R"},{f:"2026-02-23",ti:"i",c:"salario",d:"Total Salario",v:8053347.0,r:"R"},{f:"2026-02-23",ti:"i",c:"salario",d:"Otros Ingresos(No salario)",v:1938479.0,r:"R"},{f:"2026-02-23",ti:"i",c:"salario",d:"Total Renta Disponible",v:9991826.0,r:"R"},{f:"2026-02-22",ti:"e",c:"alimentacion",d:"Alimentación",v:30000.0,r:"E"},{f:"2026-02-21",ti:"e",c:"diarios",d:"Gasto diario",v:26700.0,r:"E"},{f:"2026-02-21",ti:"e",c:"carro",d:"Otros gastos",v:14900.0,r:"E"},{f:"2026-02-20",ti:"e",c:"moto",d:"Aceite de motor",v:28000.0,r:"E"},{f:"2026-02-19",ti:"e",c:"alimentacion",d:"Alimentación",v:14000.0,r:"E"},{f:"2026-02-18",ti:"e",c:"alimentacion",d:"Alimentación",v:114100.0,r:"E"},{f:"2026-02-17",ti:"e",c:"moto",d:"Gasolina",v:50000.0,r:"E"},{f:"2026-02-16",ti:"e",c:"alimentacion",d:"Alimentación",v:547278.0,r:"E"},{f:"2026-02-16",ti:"e",c:"diarios",d:"Gasto diario",v:8000.0,r:"E"},{f:"2026-02-16",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-02-14",ti:"e",c:"alimentacion",d:"Alimentación",v:52000.0,r:"E"},{f:"2026-02-14",ti:"e",c:"diarios",d:"Gasto diario",v:12240.0,r:"E"},{f:"2026-02-13",ti:"e",c:"carro",d:"Parqueo Carro",v:8000.0,r:"E"},{f:"2026-02-12",ti:"e",c:"diarios",d:"Gasto diario",v:48900.0,r:"E"},{f:"2026-02-12",ti:"e",c:"carro",d:"Parqueo Carro",v:8000.0,r:"E"},{f:"2026-02-11",ti:"e",c:"alimentacion",d:"Alimentación",v:51000.0,r:"E"},{f:"2026-02-10",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-02-09",ti:"e",c:"alimentacion",d:"Alimentación",v:38250.0,r:"E"},{f:"2026-02-09",ti:"e",c:"diarios",d:"Gasto diario",v:77500.0,r:"E"},{f:"2026-02-09",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-02-08",ti:"e",c:"diarios",d:"Gasto diario",v:10100.0,r:"E"},{f:"2026-02-07",ti:"e",c:"moto",d:"Otros gastos",v:87700.0,r:"E"},{f:"2026-02-06",ti:"e",c:"alimentacion",d:"Alimentación",v:24000.0,r:"E"},{f:"2026-02-06",ti:"e",c:"diarios",d:"Gasto diario",v:2000.0,r:"E"},{f:"2026-02-06",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-02-05",ti:"e",c:"alimentacion",d:"Alimentación",v:369200.0,r:"E"},{f:"2026-02-05",ti:"e",c:"diarios",d:"Gasto diario",v:50000.0,r:"E"},{f:"2026-02-05",ti:"e",c:"moto",d:"Gasolina",v:50000.0,r:"E"},{f:"2026-02-04",ti:"e",c:"alimentacion",d:"Alimentación",v:51000.0,r:"E"},{f:"2026-02-04",ti:"e",c:"diarios",d:"Gasto diario",v:38000.0,r:"E"},{f:"2026-02-04",ti:"e",c:"moto",d:"Parqueo moto",v:3800.0,r:"E"},{f:"2026-02-03",ti:"e",c:"alimentacion",d:"Alimentación",v:264500.0,r:"E"},{f:"2026-02-03",ti:"e",c:"diarios",d:"Gasto diario",v:3200.0,r:"E"},{f:"2026-02-03",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-02-02",ti:"e",c:"alimentacion",d:"Alimentación",v:26500.0,r:"E"},{f:"2026-02-02",ti:"e",c:"moto",d:"Parqueo moto",v:8000.0,r:"E"},{f:"2026-02-01",ti:"e",c:"alimentacion",d:"Alimentación",v:49800.0,r:"E"},{f:"2026-02-01",ti:"e",c:"diarios",d:"Gasto diario",v:1938479.0,r:"E"},{f:"2026-02-01",ti:"e",c:"moto",d:"Parqueo moto",v:30000.0,r:"E"},{f:"2026-02-01",ti:"e",c:"carro",d:"Parqueo Carro",v:42000.0,r:"E"},{f:"2026-01-30",ti:"e",c:"alimentacion",d:"Alimentación",v:95800.0,r:"E"},{f:"2026-01-30",ti:"e",c:"diarios",d:"Gasto diario",v:593162.0,r:"E"},{f:"2026-01-30",ti:"e",c:"carro",d:"Parqueo Carro",v:10500.0,r:"E"},{f:"2026-01-27",ti:"e",c:"diarios",d:"Gasto diario",v:160095.0,r:"E"},{f:"2026-01-27",ti:"e",c:"carro",d:"Gasolina",v:100000.0,r:"E"},{f:"2026-01-27",ti:"e",c:"carro",d:"Parqueo Carro",v:8900.0,r:"E"},{f:"2026-01-23",ti:"i",c:"salario",d:"Basico (Quincena 01)",v:2280000.0,r:"R"},{f:"2026-01-23",ti:"i",c:"salario",d:"Rodamiento(Quincena 01)",v:1550000.0,r:"R"},{f:"2026-01-23",ti:"i",c:"salario",d:"-Salud/Pensión/Cooserpack",v:216439.0,r:"R"},{f:"2026-01-23",ti:"i",c:"salario",d:"-Cooserpack",v:14200.0,r:"R"},{f:"2026-01-23",ti:"i",c:"salario",d:"Sub Quincena 01",v:3599361.0,r:"R"},{f:"2026-01-23",ti:"i",c:"salario",d:"Basico(Quincena 15)",v:2280000.0,r:"R"},{f:"2026-01-23",ti:"i",c:"salario",d:"Propinas(Quincena 15)",v:1550000.0,r:"R"},{f:"2026-01-23",ti:"i",c:"salario",d:"-Salud/Pensión",v:203850.0,r:"R"},{f:"2026-01-23",ti:"i",c:"salario",d:"Sub Quincena 15",v:3626150.0,r:"R"},{f:"2026-01-23",ti:"i",c:"salario",d:"Total Salario",v:7225511.0,r:"R"},{f:"2026-01-23",ti:"i",c:"salario",d:"Total Renta Disponible",v:7225511.0,r:"R"},{f:"2026-01-16",ti:"e",c:"alimentacion",d:"Alimentación",v:600000.0,r:"E"},{f:"2026-01-01",ti:"e",c:"alimentacion",d:"Alimentación",v:800000.0,r:"E"},{f:"2026-01-01",ti:"e",c:"moto",d:"Parqueo moto",v:25000.0,r:"E"},{f:"2026-01-01",ti:"e",c:"carro",d:"Parqueo Carro",v:32400.0,r:"E"}];
const TIPO_MAP = { i: "ingreso", e: "egreso" };
const REC_MAP = { U: "Único", E: "Eventual", R: "Recurrente" };
const SEED_TXS = SEED_RAW.map((t) => ({
  fecha: t.f, tipo: TIPO_MAP[t.ti], categoria: t.c, detalle: t.d, valor: t.v,
  recurrencia: REC_MAP[t.r] || "Eventual",
}));


const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const money = (n) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

const todayISO = () => new Date().toISOString().slice(0, 10);

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------------------------------------------------------------------------

export default function PresupuestoApp() {
  const [tab, setTab] = useState("registrar");
  const [txs, setTxs] = useState(null); // null = loading
  const [cats, setCats] = useState(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [toast, setToast] = useState(null);

  const [importBanner, setImportBanner] = useState(false);

  // Carga inicial: si es la primera vez (no hay bandera de importación),
  // se precarga el libro con los movimientos migrados del Excel.
  useEffect(() => {
    (async () => {
      let existingTxs = [];
      try {
        const r = await window.storage.get("transacciones", false);
        existingTxs = r ? JSON.parse(r.value) : [];
      } catch {
        existingTxs = [];
      }

      let seeded = false;
      try {
        await window.storage.get("seed_imported_v2", false);
        seeded = true;
      } catch {
        seeded = false;
      }

      if (!seeded) {
        const merged = [...existingTxs, ...SEED_TXS];
        setTxs(merged);
        try {
          await window.storage.set("transacciones", JSON.stringify(merged), false);
          await window.storage.set("seed_imported_v2", "true", false);
          setImportBanner(true);
          setTimeout(() => setImportBanner(false), 5000);
        } catch {
          // si falla el guardado, igual mostramos los datos en memoria
        }
      } else {
        setTxs(existingTxs);
      }

      try {
        const r = await window.storage.get("categorias", false);
        setCats(r ? JSON.parse(r.value) : CATS_DEFAULT);
      } catch {
        setCats(CATS_DEFAULT);
      }
    })();
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const saveTxs = useCallback(async (next) => {
    setTxs(next);
    try {
      const res = await window.storage.set("transacciones", JSON.stringify(next), false);
      if (!res) showToast("No se pudo guardar. Intenta de nuevo.");
    } catch {
      showToast("Error guardando. Intenta de nuevo.");
    }
  }, [showToast]);

  const saveCats = useCallback(async (next) => {
    setCats(next);
    try {
      await window.storage.set("categorias", JSON.stringify(next), false);
    } catch {
      showToast("Error guardando categoría.");
    }
  }, [showToast]);

  const addTx = useCallback((tx) => {
    const next = [{ ...tx, id: uid() }, ...(txs || [])];
    saveTxs(next);
    showToast("Movimiento registrado");
  }, [txs, saveTxs, showToast]);

  const deleteTx = useCallback((id) => {
    saveTxs((txs || []).filter((t) => t.id !== id));
  }, [txs, saveTxs]);

  const addCat = useCallback((nombre, tipo) => {
    const id = nombre.toLowerCase().trim().replace(/\s+/g, "_") + "_" + uid().slice(0, 3);
    saveCats([...(cats || []), { id, nombre: nombre.trim(), tipo }]);
  }, [cats, saveCats]);

  const loading = txs === null || cats === null;

  const refDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthTxs = useMemo(() => {
    if (!txs) return [];
    const y = refDate.getFullYear(), m = refDate.getMonth();
    return txs.filter((t) => {
      const d = new Date(t.fecha + "T00:00:00");
      return d.getFullYear() === y && d.getMonth() === m;
    });
  }, [txs, refDate]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#EDE6D6", fontFamily: "'Georgia', serif" }}>
      <style>{`
        .mono { font-family: 'Courier New', ui-monospace, monospace; }
        .tape-edge {
          background-image: radial-gradient(circle at 6px 6px, #EDE6D6 5px, transparent 5.5px);
          background-size: 14px 12px;
          background-position: -3px -6px;
        }
      `}</style>

      <Header refDate={refDate} monthOffset={monthOffset} setMonthOffset={setMonthOffset} monthTxs={monthTxs} />

      {importBanner && (
        <div className="max-w-md w-full mx-auto px-4 pt-3">
          <div className="rounded-lg px-3 py-2 text-xs mono flex items-center gap-2"
            style={{ background: "#C89B3C22", border: "1px solid #C89B3C", color: "#7a5a12" }}>
            <Receipt size={14} /> Se importaron {SEED_TXS.length} movimientos de tu Excel
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4 max-w-md w-full mx-auto">
        {loading ? (
          <div className="text-center py-20 mono text-sm" style={{ color: "#6b6252" }}>Cargando libro…</div>
        ) : tab === "registrar" ? (
          <RegistrarTab cats={cats} onAdd={addTx} recentTxs={txs.slice(0, 6)} onDelete={deleteTx} />
        ) : tab === "resumen" ? (
          <ResumenTab monthTxs={monthTxs} cats={cats} refDate={refDate} />
        ) : (
          <CategoriasTab cats={cats} monthTxs={monthTxs} onAddCat={addCat} />
        )}
      </main>

      <TabBar tab={tab} setTab={setTab} />

      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm mono shadow-lg z-50"
          style={{ background: "#1F3A2E", color: "#EDE6D6" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

// --- Header con saldo del mes -------------------------------------------------

function Header({ refDate, monthOffset, setMonthOffset, monthTxs }) {
  const ingresos = monthTxs.filter((t) => t.tipo === "ingreso").reduce((s, t) => s + Number(t.valor || 0), 0);
  const egresos = monthTxs.filter((t) => t.tipo === "egreso").reduce((s, t) => s + Number(t.valor || 0), 0);
  const saldo = ingresos - egresos;

  return (
    <div style={{ background: "#1F3A2E", color: "#EDE6D6" }} className="px-4 pt-6 pb-5">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setMonthOffset(monthOffset - 1)} aria-label="Mes anterior" className="p-1 opacity-80 hover:opacity-100">
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <div className="text-xs tracking-[0.2em] uppercase opacity-70 mono">Presupuesto</div>
            <div className="text-lg" style={{ fontWeight: 600 }}>{MESES[refDate.getMonth()]} {refDate.getFullYear()}</div>
          </div>
          <button onClick={() => setMonthOffset(monthOffset + 1)} aria-label="Mes siguiente" className="p-1 opacity-80 hover:opacity-100">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="border-t border-dashed opacity-40 my-2" />

        <div className="flex justify-between items-baseline">
          <span className="text-xs uppercase tracking-wide opacity-70">Saldo del mes</span>
          <span className="mono text-2xl" style={{ color: saldo >= 0 ? "#C89B3C" : "#D97757" }}>
            {money(saldo)}
          </span>
        </div>
        <div className="flex justify-between mt-1 text-xs mono opacity-80">
          <span>Ingresos {money(ingresos)}</span>
          <span>Egresos {money(egresos)}</span>
        </div>
      </div>
    </div>
  );
}

// --- Tab: Registrar ---------------------------------------------------------

function RegistrarTab({ cats, onAdd, recentTxs, onDelete }) {
  const [tipo, setTipo] = useState("egreso");
  const [categoria, setCategoria] = useState(cats.find((c) => c.tipo === "egreso")?.id || "");
  const [detalle, setDetalle] = useState("");
  const [valor, setValor] = useState("");
  const [fecha, setFecha] = useState(todayISO());
  const [recurrencia, setRecurrencia] = useState("Eventual");

  const catsFiltradas = cats.filter((c) => c.tipo === tipo);

  useEffect(() => {
    if (!catsFiltradas.find((c) => c.id === categoria)) {
      setCategoria(catsFiltradas[0]?.id || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  const submit = (e) => {
    e.preventDefault();
    const v = parseFloat(valor);
    if (!v || v <= 0 || !categoria) return;
    onAdd({ tipo, categoria, detalle: detalle.trim() || "Sin detalle", valor: v, fecha, recurrencia });
    setDetalle("");
    setValor("");
  };

  return (
    <div>
      <form onSubmit={submit} className="rounded-xl p-4 mb-6" style={{ background: "#F7F3E9", border: "1px solid #d8cfb8" }}>
        <div className="flex rounded-lg overflow-hidden mb-4" style={{ border: "1px solid #1F3A2E" }}>
          {["egreso", "ingreso"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className="flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-1"
              style={tipo === t
                ? { background: "#1F3A2E", color: "#EDE6D6" }
                : { background: "transparent", color: "#1F3A2E" }}
            >
              {t === "egreso" ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
              {t === "egreso" ? "Egreso" : "Ingreso"}
            </button>
          ))}
        </div>

        <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: "#6b6252" }}>Categoría</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {catsFiltradas.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setCategoria(c.id)}
              className="px-3 py-1.5 rounded-full text-xs mono border"
              style={categoria === c.id
                ? { background: "#C89B3C", borderColor: "#C89B3C", color: "#1F3A2E" }
                : { background: "transparent", borderColor: "#c9bfa4", color: "#4a4436" }}
            >
              {c.nombre}
            </button>
          ))}
        </div>

        <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: "#6b6252" }}>Valor (COP)</label>
        <input
          type="number"
          inputMode="numeric"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="0"
          required
          className="w-full mb-4 px-3 py-2 rounded-lg mono text-lg outline-none"
          style={{ background: "#fff", border: "1px solid #d8cfb8", color: "#1F3A2E" }}
        />

        <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: "#6b6252" }}>Detalle</label>
        <input
          type="text"
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
          placeholder="Ej. Gasolina moto, mercado…"
          className="w-full mb-4 px-3 py-2 rounded-lg outline-none text-sm"
          style={{ background: "#fff", border: "1px solid #d8cfb8", color: "#1F3A2E" }}
        />

        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: "#6b6252" }}>Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3 py-2 rounded-lg outline-none text-sm mono"
              style={{ background: "#fff", border: "1px solid #d8cfb8", color: "#1F3A2E" }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: "#6b6252" }}>Recurrencia</label>
            <select
              value={recurrencia}
              onChange={(e) => setRecurrencia(e.target.value)}
              className="w-full px-3 py-2 rounded-lg outline-none text-sm"
              style={{ background: "#fff", border: "1px solid #d8cfb8", color: "#1F3A2E" }}
            >
              {RECURRENCIAS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          style={{ background: "#1F3A2E", color: "#EDE6D6" }}
        >
          <Plus size={18} /> Registrar movimiento
        </button>
      </form>

      <div className="text-xs uppercase tracking-wide mb-2 flex items-center gap-1" style={{ color: "#6b6252" }}>
        <Receipt size={14} /> Últimos movimientos
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: "#F7F3E9", border: "1px solid #d8cfb8" }}>
        {recentTxs.length === 0 && (
          <div className="p-4 text-sm text-center" style={{ color: "#8a8064" }}>Aún no hay movimientos registrados.</div>
        )}
        {recentTxs.map((t, i) => (
          <div
            key={t.id}
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderTop: i === 0 ? "none" : "1px dashed #d8cfb8" }}
          >
            <div className="min-w-0">
              <div className="text-sm truncate" style={{ color: "#2b2818" }}>{t.detalle}</div>
              <div className="text-xs mono" style={{ color: "#8a8064" }}>
                {t.fecha} · {cats.find((c) => c.id === t.categoria)?.nombre || t.categoria}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="mono text-sm" style={{ color: t.tipo === "ingreso" ? "#1F3A2E" : "#B0492E" }}>
                {t.tipo === "ingreso" ? "+" : "−"}{money(t.valor)}
              </span>
              <button onClick={() => onDelete(t.id)} aria-label="Eliminar" className="opacity-40 hover:opacity-100">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Tab: Resumen ------------------------------------------------------------

function ResumenTab({ monthTxs, cats }) {
  const egresos = monthTxs.filter((t) => t.tipo === "egreso");
  const ingresos = monthTxs.filter((t) => t.tipo === "ingreso");
  const totalEgr = egresos.reduce((s, t) => s + Number(t.valor), 0);
  const totalIng = ingresos.reduce((s, t) => s + Number(t.valor), 0);

  const porCategoria = useMemo(() => {
    const map = {};
    egresos.forEach((t) => {
      map[t.categoria] = (map[t.categoria] || 0) + Number(t.valor);
    });
    return Object.entries(map)
      .map(([id, valor]) => ({ id, nombre: cats.find((c) => c.id === id)?.nombre || id, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [egresos, cats]);

  const max = porCategoria[0]?.valor || 1;

  return (
    <div>
      <div className="rounded-xl p-4 mb-4" style={{ background: "#F7F3E9", border: "1px solid #d8cfb8" }}>
        <div className="text-xs uppercase tracking-wide mb-2 flex items-center gap-1" style={{ color: "#6b6252" }}>
          <PieChart size={14} /> Ingresos vs. egresos
        </div>
        <div className="h-3 rounded-full overflow-hidden flex" style={{ background: "#e4dcc4" }}>
          <div style={{ width: `${totalIng + totalEgr ? (totalIng / (totalIng + totalEgr)) * 100 : 0}%`, background: "#1F3A2E" }} />
          <div style={{ width: `${totalIng + totalEgr ? (totalEgr / (totalIng + totalEgr)) * 100 : 0}%`, background: "#D97757" }} />
        </div>
        <div className="flex justify-between text-xs mono mt-2">
          <span style={{ color: "#1F3A2E" }}>● Ingresos {money(totalIng)}</span>
          <span style={{ color: "#D97757" }}>● Egresos {money(totalEgr)}</span>
        </div>
      </div>

      <div className="text-xs uppercase tracking-wide mb-2" style={{ color: "#6b6252" }}>Gasto por categoría</div>
      <div className="rounded-xl p-4" style={{ background: "#F7F3E9", border: "1px solid #d8cfb8" }}>
        {porCategoria.length === 0 && (
          <div className="text-sm text-center py-4" style={{ color: "#8a8064" }}>Sin egresos este mes todavía.</div>
        )}
        {porCategoria.map((c) => (
          <div key={c.id} className="mb-3 last:mb-0">
            <div className="flex justify-between text-sm mb-1">
              <span style={{ color: "#2b2818" }}>{c.nombre}</span>
              <span className="mono" style={{ color: "#4a4436" }}>{money(c.valor)}</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: "#e4dcc4" }}>
              <div className="h-2 rounded-full" style={{ width: `${(c.valor / max) * 100}%`, background: "#C89B3C" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Tab: Categorías -----------------------------------------------------------

function CategoriasTab({ cats, monthTxs, onAddCat }) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("egreso");
  const [showForm, setShowForm] = useState(false);

  const totalPorCat = (id) =>
    monthTxs.filter((t) => t.categoria === id).reduce((s, t) => s + Number(t.valor), 0);

  const submit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onAddCat(nombre, tipo);
    setNombre("");
    setShowForm(false);
  };

  return (
    <div>
      {["egreso", "ingreso"].map((grupo) => (
        <div key={grupo} className="mb-5">
          <div className="text-xs uppercase tracking-wide mb-2" style={{ color: "#6b6252" }}>
            {grupo === "egreso" ? "Categorías de egreso" : "Categorías de ingreso"}
          </div>
          <div className="rounded-xl overflow-hidden" style={{ background: "#F7F3E9", border: "1px solid #d8cfb8" }}>
            {cats.filter((c) => c.tipo === grupo).map((c, i) => (
              <div key={c.id} className="flex justify-between items-center px-4 py-2.5"
                style={{ borderTop: i === 0 ? "none" : "1px dashed #d8cfb8" }}>
                <span className="text-sm" style={{ color: "#2b2818" }}>{c.nombre}</span>
                <span className="mono text-sm" style={{ color: "#8a8064" }}>{money(totalPorCat(c.id))}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showForm ? (
        <form onSubmit={submit} className="rounded-xl p-4" style={{ background: "#F7F3E9", border: "1px solid #d8cfb8" }}>
          <input
            autoFocus
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre de la categoría"
            className="w-full mb-3 px-3 py-2 rounded-lg outline-none text-sm"
            style={{ background: "#fff", border: "1px solid #d8cfb8" }}
          />
          <div className="flex rounded-lg overflow-hidden mb-3" style={{ border: "1px solid #1F3A2E" }}>
            {["egreso", "ingreso"].map((t) => (
              <button type="button" key={t} onClick={() => setTipo(t)} className="flex-1 py-1.5 text-sm"
                style={tipo === t ? { background: "#1F3A2E", color: "#EDE6D6" } : { color: "#1F3A2E" }}>
                {t === "egreso" ? "Egreso" : "Ingreso"}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-2 rounded-lg flex items-center justify-center gap-1"
              style={{ background: "#1F3A2E", color: "#EDE6D6" }}>
              <Check size={16} /> Guardar
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg"
              style={{ border: "1px solid #d8cfb8", color: "#4a4436" }}>
              <X size={16} />
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-lg text-sm flex items-center justify-center gap-2"
          style={{ border: "1px dashed #a89f83", color: "#4a4436" }}
        >
          <Plus size={16} /> Nueva categoría
        </button>
      )}
    </div>
  );
}

// --- Barra inferior ----------------------------------------------------------

function TabBar({ tab, setTab }) {
  const items = [
    { id: "registrar", label: "Registrar", icon: Plus },
    { id: "resumen", label: "Resumen", icon: Wallet },
    { id: "categorias", label: "Categorías", icon: Tags },
  ];
  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex justify-around py-2 z-40"
      style={{ background: "#1F3A2E", borderTop: "1px solid #16281f" }}
    >
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setTab(id)}
          className="flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg"
          style={{ color: tab === id ? "#C89B3C" : "#EDE6D6", opacity: tab === id ? 1 : 0.65 }}
        >
          <Icon size={20} />
          <span className="text-[10px] mono">{label}</span>
        </button>
      ))}
    </div>
  );
}
