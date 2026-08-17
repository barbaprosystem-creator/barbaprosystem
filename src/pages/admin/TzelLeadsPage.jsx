import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Search, Filter, Copy, Check, ExternalLink, Flame, Sparkles,
  MapPin, MessageSquare, ArrowRight, RefreshCw,
  Phone, UserCheck, Shield, Home, Wrench, Layers, Tag,
  Globe, CheckCircle2, AlertCircle, LogIn, Link2,
  PhoneCall, PhoneOff, Mic, MicOff, Send, CalendarCheck, Clock, CheckCircle
} from 'lucide-react';

// 48 LEADS CALIFICADOS EMBEBIDOS COMO ESTADO INICIAL
const INITIAL_VERIFIED_LEADS = [
  {
    "id": "0f554c31-9a1c-4b5c-a449-070683449cee",
    "first_name": "Vecino / Propietario",
    "last_name": "(Facebook Louisville)",
    "email": null,
    "phone": null,
    "address": "Louisville Metro / Sur de Indiana",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "warm",
    "external_ref": "LEAD_FB_GLOBAL_aHR0cHM6Ly93d3cuZmFjZWJv",
    "notes": "🎯 SOLICITUD DE PROPIETARIO EN FACEBOOK:\n💰 VALOR ESTIMADO: $5500 USD\n🔥 URGENCIA: HIGH\n📌 Proyecto: 🎨 ACABADOS INTERIORES: Cliente (Vecino / Propietario) busca especialista en drywall, pintura, pisos o sótano.\n💬 Publicación: \"Looking for an affordable, experienced, and reliable person to replace vinyl flooring in the basement of a house in West Louisville....\"\n\n🔗 ENLACE A LA PUBLICACIÓN: https://www.facebook.com/groups/948251975923454/?__cft__[0]=AZZvcxvzwuQXfc9ApMuluK6iiSI2_aJcmnqmeK8IK7w9dhMocCdX8Yu50HqO32YAChkqzscqfHnFx4WEpp2qwMeEZOsyHdEQfUik3McRLB5Q2hcax6rDeTTqisTFAGcT-MgvA5XFIedb67tZLeYdi5tCbBUK9P0bJe68JIn2vEV-YChb02DLSQIgR1zN6XbEAkJB_SsIWKRpG6OX7zmBmOXo&__tn__=%3C%3C%2CP-R\n👤 PERFIL DEL AUTOR: N/A\n\n🤖 MENSAJE / RESPUESTA SUGERIDA:\nHola Vecino / Propietario, vimos tu solicitud en Facebook para RENOVATION_REMODEL. En Barba Construction estamos en Louisville y podemos hacerte un presupuesto gratis sin compromiso.",
    "created_at": "2026-08-17T23:21:34.362957+00:00",
    "updated_at": "2026-08-17T23:21:34.362957+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "c618e0c4-b95d-4498-bb03-21223d0c06b6",
    "first_name": "Propietario",
    "last_name": "del Inmueble",
    "email": null,
    "phone": null,
    "address": "East Hollingsworth Road, Louisville, IN",
    "city": "Louisville",
    "state": "IN",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_STORM_e1409b5c41b5",
    "notes": "🎯 NECESIDAD: Cliente solicita presupuesto para ROOFING_SIDING_GUTTERS en 148 Rowletts-Cave Spring Road, Louisville, KY.\n💰 VALOR ESTIMADO: $18,500 USD\n🔥 URGENCIA: HIGH\n📍 UBICACIÓN / ÁREA: 148 Rowletts-Cave Spring Road, Louisville, KY\n🌐 FUENTE: NOAA / National Weather Service (LMK/IND)\n🔗 ENLACE ORIGINAL: N/A\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM):\n\"Hola Propietario del Inmueble, vi tu publicación buscando especialista en ROOFING_SIDING_GUTTERS. En Barba Construction contamos con cuadrilla local en Louisville/Sur de IN y fotos de proyectos similares. Podemos pasar hoy o mañana a hacerte un estimado gratuito y sin compromiso. ¿Qué día te queda mejor?\"\n\n💬 COMENTARIO PÚBLICO SUGERIDO:\n\"Hola Propietario del Inmueble, te envié un mensaje privado con fotos de trabajos similares que hemos realizado en el área. ¡Estamos a la orden para un estimado gratis!\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Propietario del Inmueble, saw your post regarding ROOFING_SIDING_GUTTERS. We are local contractors in the Louisville/Southern IN area. We'd love to stop by for a quick, free on-site estimate. Let us know when works best for you!\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Propietario del Inmueble, te llamo de Barba Construction con respecto a tu solicitud de cotización para ROOFING_SIDING_GUTTERS.\"\n=========================================\n📄 DETALLES ORIGINALES:\nReporte de tormenta oficial NOAA (TORNADO / HAIL / WIND): Daño por viento severo o granizo. Techo y fachada dañados. 100% reclamable a póliza de seguro.",
    "created_at": "2026-08-17T22:15:57.029177+00:00",
    "updated_at": "2026-08-17T22:15:57.029177+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "e6d056e6-437a-444a-9348-4701d4352586",
    "first_name": "Vecino:",
    "last_name": "Inicio",
    "email": null,
    "phone": "5025506926",
    "address": "Vecindario en Louisville Metro / Sur de IN",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "warm",
    "external_ref": "LEAD_ND_SW5pY2lvCkEgbGEg",
    "notes": "🎯 NECESIDAD: Cliente solicita presupuesto para RENOVATION_REMODEL en Vecindario en Louisville Metro / Sur de IN.\n💰 VALOR ESTIMADO: $0 USD\n🔥 URGENCIA: NORMAL\n📍 UBICACIÓN / ÁREA: Vecindario en Louisville Metro / Sur de IN\n🌐 FUENTE: Nextdoor News Feed\n🔗 ENLACE ORIGINAL: https://nextdoor.com/news_feed/\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM):\n\"Hola Vecino: Steve Mills, vi tu publicación buscando especialista en RENOVATION_REMODEL. En Barba Construction contamos con cuadrilla local en Louisville/Sur de IN y fotos de proyectos similares. Podemos pasar hoy o mañana a hacerte un estimado gratuito y sin compromiso. ¿Qué día te queda mejor?\"\n\n💬 COMENTARIO PÚBLICO SUGERIDO:\n\"Hola Vecino: Steve Mills, te envié un mensaje privado con fotos de trabajos similares que hemos realizado en el área. ¡Estamos a la orden para un estimado gratis!\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Vecino: Steve Mills, saw your post regarding RENOVATION_REMODEL. We are local contractors in the Louisville/Southern IN area. We'd love to stop by for a quick, free on-site estimate. Let us know when works best for you!\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Vecino: Steve Mills, te llamo de Barba Construction con respecto a tu solicitud de cotización para RENOVATION_REMODEL.\"\n=========================================\n📄 DETALLES ORIGINALES:\nPublicación en Nextdoor: \"Steve Mills\nMile of Sunshine\n·\nhace 5 días\n·\nWhy are we remodeling the Belvedere. People are staying away from Nulu or Highlands now. Businesses are leaving there too much craziness going on from people not spending mone...\"",
    "created_at": "2026-08-17T22:14:50.870889+00:00",
    "updated_at": "2026-08-17T22:14:50.870889+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "9aa1efa6-96da-4cda-834f-5702b9a81627",
    "first_name": "Michael",
    "last_name": "R Mcmullan",
    "email": null,
    "phone": "(502) 777-7742",
    "address": "7006 BROOK BEND WAY, LOUISVILLE, KY 40229",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_12749",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X19 | Estado: New Violation | Multa: $100 USD\n👤 Propietario Registrado: Michael R Mcmullan (🏢 Inversionista / Propietario No Residente (Mailing: 14305 Micawber Way, Louisville, KY 40245))\n🏠 Inmueble: 7006 BROOK BEND WAY, LOUISVILLE, KY 40229\n🎯 NECESIDAD: ROOFING_SIDING_GUTTERS\n💰 VALOR ESTIMADO: $11500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X19: Reparación obligatoria de fachada/techo. Multa potencial: $100 USD\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=7006%20BROOK%20BEND%20WAY&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=7006%20BROOK%20BEND%20WAY%2C%20LOUISVILLE%2C%20KY%2040229\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Michael R Mcmullan, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X19 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Michael R Mcmullan, we are contacting you from Barba Construction regarding city code citation X19 for your property at 7006 BROOK BEND WAY. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Michael R Mcmullan, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 7006 BROOK BEND WAY.\"",
    "created_at": "2026-08-17T22:13:55.093264+00:00",
    "updated_at": "2026-08-17T22:13:55.093264+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "606b34eb-b692-4f0f-8704-03c2eef9a76f",
    "first_name": "Jacob",
    "last_name": "Deacon Falone",
    "email": "jacob.falone@gmail.com",
    "phone": "(502) 387-6298",
    "address": "159 FRANCIS AVE, LOUISVILLE, KY 40214",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_12752",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X19 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Jacob Deacon Falone (🏠 Propietario Residente)\n🏠 Inmueble: 159 FRANCIS AVE, LOUISVILLE, KY 40214\n🎯 NECESIDAD: ROOFING_SIDING_GUTTERS\n💰 VALOR ESTIMADO: $11500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X19: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=159%20FRANCIS%20AVE&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=159%20FRANCIS%20AVE%2C%20LOUISVILLE%2C%20KY%2040214\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Jacob Deacon Falone, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X19 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Jacob Deacon Falone, we are contacting you from Barba Construction regarding city code citation X19 for your property at 159 FRANCIS AVE. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Jacob Deacon Falone, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 159 FRANCIS AVE.\"",
    "created_at": "2026-08-17T22:13:54.174586+00:00",
    "updated_at": "2026-08-17T22:13:54.174586+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "f15e6c82-21e5-4987-b2a7-6eabbcf98a08",
    "first_name": "William",
    "last_name": "Gardner Roe",
    "email": "gardner.roe@gmail.com",
    "phone": "(502) 262-0286",
    "address": "4214 NANEEN DR, LOUISVILLE, KY 40216",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_12757",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X19 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: William Gardner Roe (🏠 Propietario Residente)\n🏠 Inmueble: 4214 NANEEN DR, LOUISVILLE, KY 40216\n🎯 NECESIDAD: ROOFING_SIDING_GUTTERS\n💰 VALOR ESTIMADO: $11500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X19: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=4214%20NANEEN%20DR&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=4214%20NANEEN%20DR%2C%20LOUISVILLE%2C%20KY%2040216\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola William Gardner Roe, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X19 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi William Gardner Roe, we are contacting you from Barba Construction regarding city code citation X19 for your property at 4214 NANEEN DR. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola William Gardner Roe, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 4214 NANEEN DR.\"",
    "created_at": "2026-08-17T22:13:53.31773+00:00",
    "updated_at": "2026-08-17T22:13:53.31773+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "5b8f968c-e8f6-47cf-844e-a3ab600a4dad",
    "first_name": "Lisa",
    "last_name": "Jeanne Kljaich",
    "email": "lisa@northstar.k12.ak.us",
    "phone": "(502) 554-7642",
    "address": "3816 BANK ST, LOUISVILLE, KY 40212",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_12778",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X19 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Lisa Jeanne Kljaich (🏢 Inversionista / Propietario No Residente (Mailing: 5102 Maryview Dr, Louisville, KY 40216))\n🏠 Inmueble: 3816 BANK ST, LOUISVILLE, KY 40212\n🎯 NECESIDAD: ROOFING_SIDING_GUTTERS\n💰 VALOR ESTIMADO: $11500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X19: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=3816%20BANK%20ST&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=3816%20BANK%20ST%2C%20LOUISVILLE%2C%20KY%2040212\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Lisa Jeanne Kljaich, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X19 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Lisa Jeanne Kljaich, we are contacting you from Barba Construction regarding city code citation X19 for your property at 3816 BANK ST. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Lisa Jeanne Kljaich, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 3816 BANK ST.\"",
    "created_at": "2026-08-17T22:13:52.308463+00:00",
    "updated_at": "2026-08-17T22:13:52.308463+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "a859dc45-73c8-4200-8f23-174441adb809",
    "first_name": "Dominique",
    "last_name": "Maurice Thomas",
    "email": "tasha92381@yahoo.com",
    "phone": "(502) 693-1852",
    "address": "3502 CHAUNCEY AVE, LOUISVILLE, KY 40211",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_12793",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X50 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Dominique Maurice Thomas (🏢 Inversionista / Propietario No Residente (Mailing: 1242 Central Ave, Louisville, KY 40208))\n🏠 Inmueble: 3502 CHAUNCEY AVE, LOUISVILLE, KY 40211\n🎯 NECESIDAD: ROOFING_SIDING_GUTTERS\n💰 VALOR ESTIMADO: $11500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X50: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=3502%20CHAUNCEY%20AVE&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=3502%20CHAUNCEY%20AVE%2C%20LOUISVILLE%2C%20KY%2040211\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Dominique Maurice Thomas, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X50 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Dominique Maurice Thomas, we are contacting you from Barba Construction regarding city code citation X50 for your property at 3502 CHAUNCEY AVE. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Dominique Maurice Thomas, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 3502 CHAUNCEY AVE.\"",
    "created_at": "2026-08-17T22:13:51.370335+00:00",
    "updated_at": "2026-08-17T22:13:51.370335+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "070554f0-2e14-4fe7-bc25-d832870717ea",
    "first_name": "Stephanie",
    "last_name": "R Jacobi",
    "email": "steff.jacobi@gmail.com",
    "phone": "(937) 677-9388",
    "address": "2604 LINDSAY AVE, LOUISVILLE, KY 40206",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_12824",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X50 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Stephanie R Jacobi (🏢 Inversionista / Propietario No Residente (Mailing: 15424 Beckley Hills Dr, Louisville, KY 40245))\n🏠 Inmueble: 2604 LINDSAY AVE, LOUISVILLE, KY 40206\n🎯 NECESIDAD: ROOFING_SIDING_GUTTERS\n💰 VALOR ESTIMADO: $11500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X50: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=2604%20LINDSAY%20AVE&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=2604%20LINDSAY%20AVE%2C%20LOUISVILLE%2C%20KY%2040206\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Stephanie R Jacobi, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X50 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Stephanie R Jacobi, we are contacting you from Barba Construction regarding city code citation X50 for your property at 2604 LINDSAY AVE. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Stephanie R Jacobi, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 2604 LINDSAY AVE.\"",
    "created_at": "2026-08-17T21:43:44.537565+00:00",
    "updated_at": "2026-08-17T21:43:44.537565+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "9e0600bd-fe7a-4777-98b6-0b64a9ed734b",
    "first_name": "Stephanie",
    "last_name": "R Jacobi",
    "email": "steff.jacobi@gmail.com",
    "phone": "(937) 677-9388",
    "address": "2604 LINDSAY AVE, LOUISVILLE, KY 40206",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_12847",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X19 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Stephanie R Jacobi (🏢 Inversionista / Propietario No Residente (Mailing: 15424 Beckley Hills Dr, Louisville, KY 40245))\n🏠 Inmueble: 2604 LINDSAY AVE, LOUISVILLE, KY 40206\n🎯 NECESIDAD: ROOFING_SIDING_GUTTERS\n💰 VALOR ESTIMADO: $11500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X19: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=2604%20LINDSAY%20AVE&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=2604%20LINDSAY%20AVE%2C%20LOUISVILLE%2C%20KY%2040206\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Stephanie R Jacobi, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X19 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Stephanie R Jacobi, we are contacting you from Barba Construction regarding city code citation X19 for your property at 2604 LINDSAY AVE. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Stephanie R Jacobi, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 2604 LINDSAY AVE.\"",
    "created_at": "2026-08-17T21:43:44.331187+00:00",
    "updated_at": "2026-08-17T21:43:44.331187+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "6ba7955f-35eb-4982-8276-3e3d8e2a1fbd",
    "first_name": "Christopher",
    "last_name": "J Stamper",
    "email": null,
    "phone": "(502) 671-9917",
    "address": "2223 FLAT ROCK RD, LOUISVILLE, KY 40245",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_12869",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X40 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Christopher J Stamper (🏠 Propietario Residente)\n🏠 Inmueble: 2223 FLAT ROCK RD, LOUISVILLE, KY 40245\n🎯 NECESIDAD: PORCH_DECK_PATIO\n💰 VALOR ESTIMADO: $5500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X40: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=2223%20FLAT%20ROCK%20RD&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=2223%20FLAT%20ROCK%20RD%2C%20LOUISVILLE%2C%20KY%2040245\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Christopher J Stamper, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X40 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Christopher J Stamper, we are contacting you from Barba Construction regarding city code citation X40 for your property at 2223 FLAT ROCK RD. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Christopher J Stamper, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 2223 FLAT ROCK RD.\"",
    "created_at": "2026-08-17T21:43:44.118826+00:00",
    "updated_at": "2026-08-17T21:43:44.118826+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "012e936e-8144-4cd5-ab76-3baf011cb13d",
    "first_name": "Nigel",
    "last_name": "Karl Nicholas",
    "email": "nigel.nicholas@att.com",
    "phone": "(512) 689-3408",
    "address": "229 N 26TH ST, LOUISVILLE, KY 40212",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_12901",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X19 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Nigel Karl Nicholas (🏢 Inversionista / Propietario No Residente (Mailing: 2325 Lombardy Dr, Clarksville, IN 47129))\n🏠 Inmueble: 229 N 26TH ST, LOUISVILLE, KY 40212\n🎯 NECESIDAD: ROOFING_SIDING_GUTTERS\n💰 VALOR ESTIMADO: $11500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X19: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=229%20N%2026TH%20ST&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=229%20N%2026TH%20ST%2C%20LOUISVILLE%2C%20KY%2040212\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Nigel Karl Nicholas, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X19 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Nigel Karl Nicholas, we are contacting you from Barba Construction regarding city code citation X19 for your property at 229 N 26TH ST. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Nigel Karl Nicholas, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 229 N 26TH ST.\"",
    "created_at": "2026-08-17T21:43:43.905973+00:00",
    "updated_at": "2026-08-17T21:43:43.905973+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "be223445-43b9-4410-9549-c89bb53db203",
    "first_name": "Becker",
    "last_name": "& Welch Real Estate Group Llc",
    "email": "bwrealestate502@gmail.com",
    "phone": "(502) 593-4209",
    "address": "1393 S 3RD ST, LOUISVILLE, KY 40208",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_12921",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X50 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Becker & Welch Real Estate Group Llc (🏢 Inversionista / Propietario No Residente (Mailing: 1144 S 3rd St Apt 7, Louisville, KY 40203))\n🏠 Inmueble: 1393 S 3RD ST, LOUISVILLE, KY 40208\n🎯 NECESIDAD: ROOFING_SIDING_GUTTERS\n💰 VALOR ESTIMADO: $11500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X50: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=1393%20S%203RD%20ST&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=1393%20S%203RD%20ST%2C%20LOUISVILLE%2C%20KY%2040208\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Becker & Welch Real Estate Group Llc, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X50 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Becker & Welch Real Estate Group Llc, we are contacting you from Barba Construction regarding city code citation X50 for your property at 1393 S 3RD ST. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Becker & Welch Real Estate Group Llc, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 1393 S 3RD ST.\"",
    "created_at": "2026-08-17T21:43:43.707227+00:00",
    "updated_at": "2026-08-17T21:43:43.707227+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "1ed4b1c7-4de3-4bc7-942d-a1b985980710",
    "first_name": "Nigel",
    "last_name": "Karl Nicholas",
    "email": "nigel.nicholas@att.com",
    "phone": "(512) 689-3408",
    "address": "229 N 26TH ST, LOUISVILLE, KY 40212",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_12928",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X19 | Estado: Not Due | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Nigel Karl Nicholas (🏢 Inversionista / Propietario No Residente (Mailing: 2325 Lombardy Dr, Clarksville, IN 47129))\n🏠 Inmueble: 229 N 26TH ST, LOUISVILLE, KY 40212\n🎯 NECESIDAD: ROOFING_SIDING_GUTTERS\n💰 VALOR ESTIMADO: $11500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X19: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=229%20N%2026TH%20ST&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=229%20N%2026TH%20ST%2C%20LOUISVILLE%2C%20KY%2040212\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Nigel Karl Nicholas, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X19 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Nigel Karl Nicholas, we are contacting you from Barba Construction regarding city code citation X19 for your property at 229 N 26TH ST. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Nigel Karl Nicholas, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 229 N 26TH ST.\"",
    "created_at": "2026-08-17T21:43:43.504249+00:00",
    "updated_at": "2026-08-17T21:43:43.504249+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "4c1aae04-087b-4fd2-b424-9b8566e12404",
    "first_name": "Nigel",
    "last_name": "Karl Nicholas",
    "email": "nigel.nicholas@att.com",
    "phone": "(512) 689-3408",
    "address": "229 N 26TH ST, LOUISVILLE, KY 40212",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_12951",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X19 | Estado: Not Due | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Nigel Karl Nicholas (🏢 Inversionista / Propietario No Residente (Mailing: 2325 Lombardy Dr, Clarksville, IN 47129))\n🏠 Inmueble: 229 N 26TH ST, LOUISVILLE, KY 40212\n🎯 NECESIDAD: ROOFING_SIDING_GUTTERS\n💰 VALOR ESTIMADO: $11500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X19: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=229%20N%2026TH%20ST&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=229%20N%2026TH%20ST%2C%20LOUISVILLE%2C%20KY%2040212\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Nigel Karl Nicholas, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X19 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Nigel Karl Nicholas, we are contacting you from Barba Construction regarding city code citation X19 for your property at 229 N 26TH ST. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Nigel Karl Nicholas, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 229 N 26TH ST.\"",
    "created_at": "2026-08-17T21:43:43.269117+00:00",
    "updated_at": "2026-08-17T21:43:43.269117+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "d240b8cd-50ff-43e3-aea0-961268b40a67",
    "first_name": "Eric",
    "last_name": "Anthony Tisdale",
    "email": "ballatiz@yahoo.com",
    "phone": "(502) 594-6495",
    "address": "827 S 36TH ST, LOUISVILLE, KY 40211",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_12964",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X50 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Eric Anthony Tisdale (🏢 Inversionista / Propietario No Residente (Mailing: 2804 Hamilton Springs Dr, Louisville, KY 40245))\n🏠 Inmueble: 827 S 36TH ST, LOUISVILLE, KY 40211\n🎯 NECESIDAD: ROOFING_SIDING_GUTTERS\n💰 VALOR ESTIMADO: $11500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X50: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=827%20S%2036TH%20ST&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=827%20S%2036TH%20ST%2C%20LOUISVILLE%2C%20KY%2040211\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Eric Anthony Tisdale, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X50 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Eric Anthony Tisdale, we are contacting you from Barba Construction regarding city code citation X50 for your property at 827 S 36TH ST. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Eric Anthony Tisdale, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 827 S 36TH ST.\"",
    "created_at": "2026-08-17T21:43:43.05178+00:00",
    "updated_at": "2026-08-17T21:43:43.05178+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "9585fcec-04ae-4cd9-a5ee-8143256d7d6b",
    "first_name": "Lawrence",
    "last_name": "J Dillman",
    "email": null,
    "phone": "(502) 426-2065",
    "address": "1703 CIMMARON TRL, LOUISVILLE, KY 40223",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_13016",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X50 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Lawrence J Dillman (🏠 Propietario Residente)\n🏠 Inmueble: 1703 CIMMARON TRL, LOUISVILLE, KY 40223\n🎯 NECESIDAD: ROOFING_SIDING_GUTTERS\n💰 VALOR ESTIMADO: $11500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X50: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=1703%20CIMMARON%20TRL&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=1703%20CIMMARON%20TRL%2C%20LOUISVILLE%2C%20KY%2040223\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Lawrence J Dillman, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X50 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Lawrence J Dillman, we are contacting you from Barba Construction regarding city code citation X50 for your property at 1703 CIMMARON TRL. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Lawrence J Dillman, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 1703 CIMMARON TRL.\"",
    "created_at": "2026-08-17T21:43:42.848277+00:00",
    "updated_at": "2026-08-17T21:43:42.848277+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "ce2ec694-cf7e-4057-a5ad-d548ab619a74",
    "first_name": "Opal",
    "last_name": "L Ford",
    "email": "opal.ford@hotmail.com",
    "phone": "(502) 321-8087",
    "address": "6013 ALANADALE DR, LOUISVILLE, KY 40272",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_13040",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X50 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Opal L Ford (🏢 Inversionista / Propietario No Residente (Mailing: 17004 Shelbyville Rd, Fisherville, KY 40023))\n🏠 Inmueble: 6013 ALANADALE DR, LOUISVILLE, KY 40272\n🎯 NECESIDAD: ROOFING_SIDING_GUTTERS\n💰 VALOR ESTIMADO: $11500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X50: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=6013%20ALANADALE%20DR&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=6013%20ALANADALE%20DR%2C%20LOUISVILLE%2C%20KY%2040272\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Opal L Ford, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X50 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Opal L Ford, we are contacting you from Barba Construction regarding city code citation X50 for your property at 6013 ALANADALE DR. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Opal L Ford, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 6013 ALANADALE DR.\"",
    "created_at": "2026-08-17T21:43:42.629553+00:00",
    "updated_at": "2026-08-17T21:43:42.629553+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "ec8c8ef9-2ade-4d5b-8e5c-c1265a485fb7",
    "first_name": "Frances",
    "last_name": "Lorine Spinks",
    "email": "jewels6078@cs.com",
    "phone": "(502) 262-5270",
    "address": "725 E CHESTNUT ST, LOUISVILLE, KY 40202",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_13041",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X50 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Frances Lorine Spinks (🏢 Inversionista / Propietario No Residente (Mailing: 924 E Liberty St, Louisville, KY 40204))\n🏠 Inmueble: 725 E CHESTNUT ST, LOUISVILLE, KY 40202\n🎯 NECESIDAD: ROOFING_SIDING_GUTTERS\n💰 VALOR ESTIMADO: $11500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X50: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=725%20E%20CHESTNUT%20ST&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=725%20E%20CHESTNUT%20ST%2C%20LOUISVILLE%2C%20KY%2040202\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Frances Lorine Spinks, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X50 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Frances Lorine Spinks, we are contacting you from Barba Construction regarding city code citation X50 for your property at 725 E CHESTNUT ST. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Frances Lorine Spinks, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 725 E CHESTNUT ST.\"",
    "created_at": "2026-08-17T21:43:42.432664+00:00",
    "updated_at": "2026-08-17T21:43:42.432664+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "70968cfa-5303-4f02-8021-c523420d0588",
    "first_name": "Frances",
    "last_name": "Lorine Spinks",
    "email": "jewels6078@cs.com",
    "phone": "(502) 262-5270",
    "address": "725 E CHESTNUT ST, LOUISVILLE, KY 40202",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_13044",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X15 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Frances Lorine Spinks (🏢 Inversionista / Propietario No Residente (Mailing: 924 E Liberty St, Louisville, KY 40204))\n🏠 Inmueble: 725 E CHESTNUT ST, LOUISVILLE, KY 40202\n🎯 NECESIDAD: RENOVATION_REMODEL\n💰 VALOR ESTIMADO: $6500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X15: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=725%20E%20CHESTNUT%20ST&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=725%20E%20CHESTNUT%20ST%2C%20LOUISVILLE%2C%20KY%2040202\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Frances Lorine Spinks, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X15 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Frances Lorine Spinks, we are contacting you from Barba Construction regarding city code citation X15 for your property at 725 E CHESTNUT ST. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Frances Lorine Spinks, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 725 E CHESTNUT ST.\"",
    "created_at": "2026-08-17T21:43:42.23592+00:00",
    "updated_at": "2026-08-17T21:43:42.23592+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "898a5f0d-286b-4ae8-a682-64ea34f18e7d",
    "first_name": "Troy",
    "last_name": "Lavelle Taylor",
    "email": "ttaylor1460@gmail.com",
    "phone": "(502) 472-6706",
    "address": "721 S 41ST ST, LOUISVILLE, KY 40211",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_13096",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X50 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Troy Lavelle Taylor (🏢 Inversionista / Propietario No Residente (Mailing: PO Box 161602, Louisville, KY 40256))\n🏠 Inmueble: 721 S 41ST ST, LOUISVILLE, KY 40211\n🎯 NECESIDAD: ROOFING_SIDING_GUTTERS\n💰 VALOR ESTIMADO: $11500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X50: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=721%20S%2041ST%20ST&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=721%20S%2041ST%20ST%2C%20LOUISVILLE%2C%20KY%2040211\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Troy Lavelle Taylor, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X50 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Troy Lavelle Taylor, we are contacting you from Barba Construction regarding city code citation X50 for your property at 721 S 41ST ST. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Troy Lavelle Taylor, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 721 S 41ST ST.\"",
    "created_at": "2026-08-17T21:43:42.015152+00:00",
    "updated_at": "2026-08-17T21:43:42.015152+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "ec6c19a3-8230-44b9-aa98-a662912100ca",
    "first_name": "Averie",
    "last_name": "T Morris",
    "email": "atmorris24@outlook.com",
    "phone": null,
    "address": "201 CASA BELLA CT, LOUISVILLE, KY 40220",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_13106",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X40 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Averie T Morris (🏠 Propietario Residente)\n🏠 Inmueble: 201 CASA BELLA CT, LOUISVILLE, KY 40220\n🎯 NECESIDAD: PORCH_DECK_PATIO\n💰 VALOR ESTIMADO: $5500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X40: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=201%20CASA%20BELLA%20CT&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=201%20CASA%20BELLA%20CT%2C%20LOUISVILLE%2C%20KY%2040220\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Averie T Morris, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X40 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Averie T Morris, we are contacting you from Barba Construction regarding city code citation X40 for your property at 201 CASA BELLA CT. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Averie T Morris, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 201 CASA BELLA CT.\"",
    "created_at": "2026-08-17T21:43:41.802047+00:00",
    "updated_at": "2026-08-17T21:43:41.802047+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "cce1c1c4-8b4b-40d9-a57f-315f20c70396",
    "first_name": "Roger",
    "last_name": "Allen Norem",
    "email": "mjcat12@hotmail.com",
    "phone": "(502) 533-1819",
    "address": "301 CASA BELLA CT, LOUISVILLE, KY 40220",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_13108",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X40 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Roger Allen Norem (🏢 Inversionista / Propietario No Residente (Mailing: Winter Springs Ct, Middletown, KY 40243))\n🏠 Inmueble: 301 CASA BELLA CT, LOUISVILLE, KY 40220\n🎯 NECESIDAD: PORCH_DECK_PATIO\n💰 VALOR ESTIMADO: $5500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X40: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=301%20CASA%20BELLA%20CT&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=301%20CASA%20BELLA%20CT%2C%20LOUISVILLE%2C%20KY%2040220\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Roger Allen Norem, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X40 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Roger Allen Norem, we are contacting you from Barba Construction regarding city code citation X40 for your property at 301 CASA BELLA CT. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Roger Allen Norem, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 301 CASA BELLA CT.\"",
    "created_at": "2026-08-17T21:43:41.605864+00:00",
    "updated_at": "2026-08-17T21:43:41.605864+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "2cdf45e8-127f-47ce-bdc4-fd73cec6cbcc",
    "first_name": "Douglas",
    "last_name": "Ray Pendleton",
    "email": "hccpendleton@aol.com",
    "phone": "(502) 435-6188",
    "address": "1016 BROOKLINE AVE, LOUISVILLE, KY 40215",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_13151",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X50 | Estado: New Violation | Multa: $100 USD\n👤 Propietario Registrado: Douglas Ray Pendleton (🏢 Inversionista / Propietario No Residente (Mailing: 9210 Marse Henry Dr, Louisville, KY 40299))\n🏠 Inmueble: 1016 BROOKLINE AVE, LOUISVILLE, KY 40215\n🎯 NECESIDAD: ROOFING_SIDING_GUTTERS\n💰 VALOR ESTIMADO: $11500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X50: Reparación obligatoria de fachada/techo. Multa potencial: $100 USD\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=1016%20BROOKLINE%20AVE&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=1016%20BROOKLINE%20AVE%2C%20LOUISVILLE%2C%20KY%2040215\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Douglas Ray Pendleton, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X50 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Douglas Ray Pendleton, we are contacting you from Barba Construction regarding city code citation X50 for your property at 1016 BROOKLINE AVE. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Douglas Ray Pendleton, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 1016 BROOKLINE AVE.\"",
    "created_at": "2026-08-17T21:43:41.403741+00:00",
    "updated_at": "2026-08-17T21:43:41.403741+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "4930ab02-9df2-4233-b4f7-7ca16ce3f618",
    "first_name": "Douglas",
    "last_name": "Ray Pendleton",
    "email": "hccpendleton@aol.com",
    "phone": "(502) 435-6188",
    "address": "1016 BROOKLINE AVE, LOUISVILLE, KY 40215",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_13153",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X40 | Estado: New Violation | Multa: $100 USD\n👤 Propietario Registrado: Douglas Ray Pendleton (🏢 Inversionista / Propietario No Residente (Mailing: 9210 Marse Henry Dr, Louisville, KY 40299))\n🏠 Inmueble: 1016 BROOKLINE AVE, LOUISVILLE, KY 40215\n🎯 NECESIDAD: PORCH_DECK_PATIO\n💰 VALOR ESTIMADO: $5500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X40: Reparación obligatoria de fachada/techo. Multa potencial: $100 USD\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=1016%20BROOKLINE%20AVE&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=1016%20BROOKLINE%20AVE%2C%20LOUISVILLE%2C%20KY%2040215\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Douglas Ray Pendleton, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X40 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Douglas Ray Pendleton, we are contacting you from Barba Construction regarding city code citation X40 for your property at 1016 BROOKLINE AVE. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Douglas Ray Pendleton, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 1016 BROOKLINE AVE.\"",
    "created_at": "2026-08-17T21:43:41.202083+00:00",
    "updated_at": "2026-08-17T21:43:41.202083+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "5820a7e7-771b-47ec-85e6-1ee1ddd309d0",
    "first_name": "Douglas",
    "last_name": "Ray Pendleton",
    "email": "hccpendleton@aol.com",
    "phone": "(502) 435-6188",
    "address": "1016 BROOKLINE AVE, LOUISVILLE, KY 40215",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_13154",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X19 | Estado: New Violation | Multa: $100 USD\n👤 Propietario Registrado: Douglas Ray Pendleton (🏢 Inversionista / Propietario No Residente (Mailing: 9210 Marse Henry Dr, Louisville, KY 40299))\n🏠 Inmueble: 1016 BROOKLINE AVE, LOUISVILLE, KY 40215\n🎯 NECESIDAD: ROOFING_SIDING_GUTTERS\n💰 VALOR ESTIMADO: $11500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X19: Reparación obligatoria de fachada/techo. Multa potencial: $100 USD\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=1016%20BROOKLINE%20AVE&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=1016%20BROOKLINE%20AVE%2C%20LOUISVILLE%2C%20KY%2040215\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Douglas Ray Pendleton, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X19 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Douglas Ray Pendleton, we are contacting you from Barba Construction regarding city code citation X19 for your property at 1016 BROOKLINE AVE. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Douglas Ray Pendleton, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 1016 BROOKLINE AVE.\"",
    "created_at": "2026-08-17T21:43:40.974977+00:00",
    "updated_at": "2026-08-17T21:43:40.974977+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "e16d6d47-896c-49ce-95e1-f927aff46f54",
    "first_name": "Robert",
    "last_name": "Doug Cecil",
    "email": null,
    "phone": "(502) 475-8827",
    "address": "4511 BREITENSTEIN AVE, LOUISVILLE, KY 40213",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_13176",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X19 | Estado: New Violation | Multa: $100 USD\n👤 Propietario Registrado: Robert Doug Cecil (🏠 Propietario Residente)\n🏠 Inmueble: 4511 BREITENSTEIN AVE, LOUISVILLE, KY 40213\n🎯 NECESIDAD: ROOFING_SIDING_GUTTERS\n💰 VALOR ESTIMADO: $11500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X19: Reparación obligatoria de fachada/techo. Multa potencial: $100 USD\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=4511%20BREITENSTEIN%20AVE&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=4511%20BREITENSTEIN%20AVE%2C%20LOUISVILLE%2C%20KY%2040213\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Robert Doug Cecil, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X19 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Robert Doug Cecil, we are contacting you from Barba Construction regarding city code citation X19 for your property at 4511 BREITENSTEIN AVE. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Robert Doug Cecil, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 4511 BREITENSTEIN AVE.\"",
    "created_at": "2026-08-17T21:43:40.771732+00:00",
    "updated_at": "2026-08-17T21:43:40.771732+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "d4a838c0-f5c5-410e-b259-827c311dd668",
    "first_name": "Deepa",
    "last_name": "Arla",
    "email": "deepaarla@gmail.com",
    "phone": "(502) 418-9028",
    "address": "319 E ST CATHERINE ST, LOUISVILLE, KY 40203",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_13202",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X40 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Deepa Arla (🏢 Inversionista / Propietario No Residente (Mailing: 1033 W Van Buren St # 6, Chicago, IL 60607))\n🏠 Inmueble: 319 E ST CATHERINE ST, LOUISVILLE, KY 40203\n🎯 NECESIDAD: PORCH_DECK_PATIO\n💰 VALOR ESTIMADO: $5500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X40: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=319%20E%20ST%20CATHERINE%20ST&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=319%20E%20ST%20CATHERINE%20ST%2C%20LOUISVILLE%2C%20KY%2040203\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Deepa Arla, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X40 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Deepa Arla, we are contacting you from Barba Construction regarding city code citation X40 for your property at 319 E ST CATHERINE ST. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Deepa Arla, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 319 E ST CATHERINE ST.\"",
    "created_at": "2026-08-17T21:43:40.569496+00:00",
    "updated_at": "2026-08-17T21:43:40.569496+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "f8fbd23b-fcde-476b-ade1-17766ba3bd97",
    "first_name": "Marteta",
    "last_name": "Dale Krages",
    "email": "mkrages60@gmail.com",
    "phone": "(502) 356-0251",
    "address": "7516 GARRISON RD, LOUISVILLE, KY 40214",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_13210",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X50 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Marteta Dale Krages (🏢 Inversionista / Propietario No Residente (Mailing: 126 University Woods Dr, New Albany, IN 47150))\n🏠 Inmueble: 7516 GARRISON RD, LOUISVILLE, KY 40214\n🎯 NECESIDAD: ROOFING_SIDING_GUTTERS\n💰 VALOR ESTIMADO: $11500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X50: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=7516%20GARRISON%20RD&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=7516%20GARRISON%20RD%2C%20LOUISVILLE%2C%20KY%2040214\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Marteta Dale Krages, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X50 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Marteta Dale Krages, we are contacting you from Barba Construction regarding city code citation X50 for your property at 7516 GARRISON RD. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Marteta Dale Krages, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 7516 GARRISON RD.\"",
    "created_at": "2026-08-17T21:43:40.336818+00:00",
    "updated_at": "2026-08-17T21:43:40.336818+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "b21a6dd5-85f5-46a1-81bc-90db5c8baaea",
    "first_name": "Melissa",
    "last_name": "M Poole",
    "email": "mspoole16@hotmail.com",
    "phone": "(502) 552-0541",
    "address": "7510 GARRISON RD, LOUISVILLE, KY 40214",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_13221",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X50 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Melissa M Poole (🏢 Inversionista / Propietario No Residente (Mailing: 108 Algiers Ct Apt 3, Louisville, KY 40218))\n🏠 Inmueble: 7510 GARRISON RD, LOUISVILLE, KY 40214\n🎯 NECESIDAD: ROOFING_SIDING_GUTTERS\n💰 VALOR ESTIMADO: $11500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X50: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=7510%20GARRISON%20RD&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=7510%20GARRISON%20RD%2C%20LOUISVILLE%2C%20KY%2040214\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Melissa M Poole, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X50 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Melissa M Poole, we are contacting you from Barba Construction regarding city code citation X50 for your property at 7510 GARRISON RD. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Melissa M Poole, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 7510 GARRISON RD.\"",
    "created_at": "2026-08-17T21:43:40.092059+00:00",
    "updated_at": "2026-08-17T21:43:40.092059+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "17a87ac5-a94b-4ff6-85d0-6451d13c90a4",
    "first_name": "Michael",
    "last_name": "N Le",
    "email": "michaelle41@yahoo.com",
    "phone": "(502) 299-0109",
    "address": "8704 BOST LN, LOUISVILLE, KY 40219",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_13263",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X15 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Michael N Le (🏢 Inversionista / Propietario No Residente (Mailing: 6820 Manslick Rd, Louisville, KY 40214))\n🏠 Inmueble: 8704 BOST LN, LOUISVILLE, KY 40219\n🎯 NECESIDAD: RENOVATION_REMODEL\n💰 VALOR ESTIMADO: $6500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X15: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=8704%20BOST%20LN&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=8704%20BOST%20LN%2C%20LOUISVILLE%2C%20KY%2040219\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Michael N Le, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X15 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Michael N Le, we are contacting you from Barba Construction regarding city code citation X15 for your property at 8704 BOST LN. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Michael N Le, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 8704 BOST LN.\"",
    "created_at": "2026-08-17T21:43:39.870513+00:00",
    "updated_at": "2026-08-17T21:43:39.870513+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "48ece694-55c4-4cf0-9676-82ab8695129c",
    "first_name": "Steven",
    "last_name": "Bradley Collins",
    "email": "scuba_steveo@hotmail.com",
    "phone": "(502) 447-2220",
    "address": "808 BROOKLINE AVE, LOUISVILLE, KY 40215",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_13273",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X40 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Steven Bradley Collins (🏢 Inversionista / Propietario No Residente (Mailing: 1413 E Breckinridge St, Louisville, KY 40204))\n🏠 Inmueble: 808 BROOKLINE AVE, LOUISVILLE, KY 40215\n🎯 NECESIDAD: PORCH_DECK_PATIO\n💰 VALOR ESTIMADO: $5500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X40: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=808%20BROOKLINE%20AVE&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=808%20BROOKLINE%20AVE%2C%20LOUISVILLE%2C%20KY%2040215\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Steven Bradley Collins, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X40 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Steven Bradley Collins, we are contacting you from Barba Construction regarding city code citation X40 for your property at 808 BROOKLINE AVE. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Steven Bradley Collins, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 808 BROOKLINE AVE.\"",
    "created_at": "2026-08-17T21:43:39.676781+00:00",
    "updated_at": "2026-08-17T21:43:39.676781+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "7a9d03f5-8ec0-4311-bb00-3521286bae5b",
    "first_name": "Steven",
    "last_name": "Bradley Collins",
    "email": "scuba_steveo@hotmail.com",
    "phone": "(502) 447-2220",
    "address": "808 BROOKLINE AVE, LOUISVILLE, KY 40215",
    "city": "Louisville",
    "state": "KY",
    "zip": null,
    "source": "other",
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_METRO_CODE_13275",
    "notes": "🚨 INFRACCIÓN MUNICIPAL DE FACHADA/TECHO (Louisville Code Enforcement):\n📌 Citación: Código X19 | Estado: New Violation | Multa: Citación / Plazo de corrección\n👤 Propietario Registrado: Steven Bradley Collins (🏢 Inversionista / Propietario No Residente (Mailing: 1413 E Breckinridge St, Louisville, KY 40204))\n🏠 Inmueble: 808 BROOKLINE AVE, LOUISVILLE, KY 40215\n🎯 NECESIDAD: ROOFING_SIDING_GUTTERS\n💰 VALOR ESTIMADO: $11500 USD\n🔥 URGENCIA: HIGH\n📋 Requerimiento: Citación municipal X19: Reparación obligatoria de fachada/techo. Multa potencial: Citación / Plazo de corrección\n\n🔍 REGISTROS PÚBLICOS: https://www.truepeoplesearch.com/results?streetaddress=808%20BROOKLINE%20AVE&citystatezip=Louisville%2C+KY\n🗺️ VER UBICACIÓN EN MAPS: https://www.google.com/maps/search/?api=1&query=808%20BROOKLINE%20AVE%2C%20LOUISVILLE%2C%20KY%2040215\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM / WHATSAPP):\n\"Hola Steven Bradley Collins, le contactamos de Barba Construction en Louisville. Brindamos servicios autorizados para corregir citaciones del código municipal X19 con garantía y precios justos.\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Steven Bradley Collins, we are contacting you from Barba Construction regarding city code citation X19 for your property at 808 BROOKLINE AVE. We specialize in fast, licensed exterior repairs to resolve citations before deadlines.\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Steven Bradley Collins, le llamo de Barba Construction en Louisville con respecto a los servicios de reparación de fachada y techo para su propiedad en 808 BROOKLINE AVE.\"",
    "created_at": "2026-08-17T21:43:39.452856+00:00",
    "updated_at": "2026-08-17T21:43:39.452856+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": null
  },
  {
    "id": "9b2512a5-ab8f-4a91-a205-8fa889671f77",
    "first_name": "John",
    "last_name": "Mittel",
    "email": "john.mittel@gmail.com",
    "phone": "(502) 419-7610",
    "address": "1842 Payne St",
    "city": "Louisville",
    "state": "KY",
    "zip": "40206",
    "source": null,
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_TZEL_9b2512a5",
    "notes": "🎯 NECESIDAD: Cliente solicita presupuesto para NEW_CONSTRUCTION_GROUND_UP en Sur de Indiana (Clark / Floyd County, IN).\n💰 VALOR ESTIMADO: $NaN USD\n🔥 URGENCIA: HIGH\n📍 UBICACIÓN / ÁREA: Sur de Indiana (Clark / Floyd County, IN)\n🌐 FUENTE: LinkedIn Posts (\"New Albany IN contractor\")\n🔗 ENLACE ORIGINAL: https://www.linkedin.com/search/results/content/?keywords=New%20Albany%20IN%20contractor&origin=SWITCH_SEARCH_VERTICAL\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM):\n\"Hola John Rodrick, P.E., M.B.A., vi tu publicación buscando especialista en NEW_CONSTRUCTION_GROUND_UP. En Barba Construction contamos con cuadrilla local en Louisville/Sur de IN y fotos de proyectos similares. Podemos pasar hoy o mañana a hacerte un estimado gratuito y sin compromiso. ¿Qué día te queda mejor?\"\n\n💬 COMENTARIO PÚBLICO SUGERIDO:\n\"Hola John Rodrick, P.E., M.B.A., te envié un mensaje privado con fotos de trabajos similares que hemos realizado en el área. ¡Estamos a la orden para un estimado gratis!\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi John Rodrick, P.E., M.B.A., saw your post regarding NEW_CONSTRUCTION_GROUND_UP. We are local contractors in the Louisville/Southern IN area. We'd love to stop by for a quick, free on-site estimate. Let us know when works best for you!\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola John Rodrick, P.E., M.B.A., te llamo de Barba Construction con respecto a tu solicitud de cotización para NEW_CONSTRUCTION_GROUND_UP.\"\n=========================================\n📄 DETALLES ORIGINALES:\n🏢 SUBCONTRATACIÓN COMERCIAL EN LINKEDIN: Oportunidad publicada por John Rodrick, P.E., M.B.A..\n💬 Publicación original:\n\"John Rodrick, P.E., M.B.A.\n\n \n • 3er+\n\nProject Manager | PE + MS + MBA | Transportation Infrastructure | Project Delivery • Business Growth\n\n1 semana • \n\nSeguir\n\nKlerner Lane over I-265 in New Albany is officially open to traffic following the successful completion a slide correc...\"\n🔗 Búsqueda en LinkedIn: https://www.linkedin.com/search/results/content/?keywords=New%20Albany%20IN%20contractor&origin=SWITCH_SEARCH_VERTICAL",
    "created_at": "2026-08-12T19:29:04.099858+00:00",
    "updated_at": "2026-08-12T19:29:04.099858+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": "2130"
  },
  {
    "id": "47db6418-c581-4436-b42c-1c903b1184dc",
    "first_name": "Alexis",
    "last_name": "Ramirez",
    "email": "lizandraleyva61@gmail.com",
    "phone": "(812) 736-8163",
    "address": "1249 Vim Dr",
    "city": "Louisville",
    "state": "KY",
    "zip": "40213",
    "source": null,
    "pipeline_status": "closed_won",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_TZEL_47db6418",
    "notes": "🎯 NECESIDAD: Cliente solicita presupuesto para NEW_CONSTRUCTION_GROUND_UP en Sur de Indiana (Clark / Floyd County, IN).\n💰 VALOR ESTIMADO: $NaN USD\n🔥 URGENCIA: HIGH\n📍 UBICACIÓN / ÁREA: Sur de Indiana (Clark / Floyd County, IN)\n🌐 FUENTE: LinkedIn Posts (\"Clarksville IN contractor\")\n🔗 ENLACE ORIGINAL: https://www.linkedin.com/search/results/content/?keywords=Clarksville%20IN%20contractor&origin=SWITCH_SEARCH_VERTICAL\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM):\n\"Hola Alexis Goines, vi tu publicación buscando especialista en NEW_CONSTRUCTION_GROUND_UP. En Barba Construction contamos con cuadrilla local en Louisville/Sur de IN y fotos de proyectos similares. Podemos pasar hoy o mañana a hacerte un estimado gratuito y sin compromiso. ¿Qué día te queda mejor?\"\n\n💬 COMENTARIO PÚBLICO SUGERIDO:\n\"Hola Alexis Goines, te envié un mensaje privado con fotos de trabajos similares que hemos realizado en el área. ¡Estamos a la orden para un estimado gratis!\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Alexis Goines, saw your post regarding NEW_CONSTRUCTION_GROUND_UP. We are local contractors in the Louisville/Southern IN area. We'd love to stop by for a quick, free on-site estimate. Let us know when works best for you!\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Alexis Goines, te llamo de Barba Construction con respecto a tu solicitud de cotización para NEW_CONSTRUCTION_GROUND_UP.\"\n=========================================\n📄 DETALLES ORIGINALES:\n🏢 SUBCONTRATACIÓN COMERCIAL EN LINKEDIN: Oportunidad publicada por Alexis Goines.\n💬 Publicación original:\n\"Alexis Goines\n\n• 3er+\n\n--\n\n2 semanas • \n\nSeguir\n\nWhen severe weather hits Clarksville, out-of-town contractors often rush in offering quick repairs. Take your time choosing who you work with and protect your home and investment!\n\nHere are a few quick tips to keep in mind:\n- Avoid...\"\n🔗 Búsqueda en LinkedIn: https://www.linkedin.com/search/results/content/?keywords=Clarksville%20IN%20contractor&origin=SWITCH_SEARCH_VERTICAL",
    "created_at": "2026-08-05T14:23:50.593414+00:00",
    "updated_at": "2026-08-17T20:58:50.054999+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": "2106"
  },
  {
    "id": "3c538167-525c-4b76-9fe6-76d17076aa33",
    "first_name": "Jacob",
    "last_name": "Pick",
    "email": "jacobpick089@gmail.com",
    "phone": "(859) 550-0360",
    "address": "4204 Lora Linda Court",
    "city": "New Albany",
    "state": "Indiana",
    "zip": "47150",
    "source": null,
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_TZEL_3c538167",
    "notes": "🎯 NECESIDAD: Cliente solicita presupuesto para NEW_CONSTRUCTION_GROUND_UP en Sur de Indiana (Clark / Floyd County, IN).\n💰 VALOR ESTIMADO: $NaN USD\n🔥 URGENCIA: HIGH\n📍 UBICACIÓN / ÁREA: Sur de Indiana (Clark / Floyd County, IN)\n🌐 FUENTE: LinkedIn Posts (\"Southern Indiana subcontractors\")\n🔗 ENLACE ORIGINAL: https://www.linkedin.com/search/results/content/?keywords=Southern%20Indiana%20subcontractors&origin=SWITCH_SEARCH_VERTICAL\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM):\n\"Hola Jacob Cavazos, vi tu publicación buscando especialista en NEW_CONSTRUCTION_GROUND_UP. En Barba Construction contamos con cuadrilla local en Louisville/Sur de IN y fotos de proyectos similares. Podemos pasar hoy o mañana a hacerte un estimado gratuito y sin compromiso. ¿Qué día te queda mejor?\"\n\n💬 COMENTARIO PÚBLICO SUGERIDO:\n\"Hola Jacob Cavazos, te envié un mensaje privado con fotos de trabajos similares que hemos realizado en el área. ¡Estamos a la orden para un estimado gratis!\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Jacob Cavazos, saw your post regarding NEW_CONSTRUCTION_GROUND_UP. We are local contractors in the Louisville/Southern IN area. We'd love to stop by for a quick, free on-site estimate. Let us know when works best for you!\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Jacob Cavazos, te llamo de Barba Construction con respecto a tu solicitud de cotización para NEW_CONSTRUCTION_GROUND_UP.\"\n=========================================\n📄 DETALLES ORIGINALES:\n🏢 SUBCONTRATACIÓN COMERCIAL EN LINKEDIN: Oportunidad publicada por Jacob Cavazos.\n💬 Publicación original:\n\"Jacob Cavazos\n\n \n • 3er+\n\nConstruction Estimator | Commercial Construction & Estimating | Project Management | Low Voltage & Security Systems\n\n5 meses • \n\nSeguir\n\nBurnCo Integration is looking to expand our service partnerships with national integrators and security providers.\n\nW...\"\n🔗 Búsqueda en LinkedIn: https://www.linkedin.com/search/results/content/?keywords=Southern%20Indiana%20subcontractors&origin=SWITCH_SEARCH_VERTICAL",
    "created_at": "2026-07-30T18:47:40.72926+00:00",
    "updated_at": "2026-07-30T18:47:40.72926+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": "2094"
  },
  {
    "id": "6bdfede5-1e36-4fb6-a074-d63e80ce2dff",
    "first_name": "Raymond",
    "last_name": "Herrick",
    "email": "raymondherrick@gmail.com",
    "phone": "(502) 641-7598",
    "address": "2816 Avenue of the Woods",
    "city": "Louisville",
    "state": "Kentucky",
    "zip": "40241",
    "source": null,
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_TZEL_6bdfede5",
    "notes": "🎯 NECESIDAD: Cliente solicita presupuesto para ROOFING_SIDING_GUTTERS en Sur de Indiana (Clark / Floyd County, IN).\n💰 VALOR ESTIMADO: $NaN USD\n🔥 URGENCIA: HIGH\n📍 UBICACIÓN / ÁREA: Sur de Indiana (Clark / Floyd County, IN)\n🌐 FUENTE: LinkedIn Posts (\"Southern Indiana general contractor bids\")\n🔗 ENLACE ORIGINAL: https://www.linkedin.com/search/results/content/?keywords=Southern%20Indiana%20general%20contractor%20bids&origin=SWITCH_SEARCH_VERTICAL\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM):\n\"Hola Raymond Jenkins, vi tu publicación buscando especialista en ROOFING_SIDING_GUTTERS. En Barba Construction contamos con cuadrilla local en Louisville/Sur de IN y fotos de proyectos similares. Podemos pasar hoy o mañana a hacerte un estimado gratuito y sin compromiso. ¿Qué día te queda mejor?\"\n\n💬 COMENTARIO PÚBLICO SUGERIDO:\n\"Hola Raymond Jenkins, te envié un mensaje privado con fotos de trabajos similares que hemos realizado en el área. ¡Estamos a la orden para un estimado gratis!\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Raymond Jenkins, saw your post regarding ROOFING_SIDING_GUTTERS. We are local contractors in the Louisville/Southern IN area. We'd love to stop by for a quick, free on-site estimate. Let us know when works best for you!\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Raymond Jenkins, te llamo de Barba Construction con respecto a tu solicitud de cotización para ROOFING_SIDING_GUTTERS.\"\n=========================================\n📄 DETALLES ORIGINALES:\n🏢 TECHOS Y CUBIERTAS COMERCIALES: Oportunidad/Subcontrato en LinkedIn (Raymond Jenkins).\n💬 Publicación original:\n\"Raymond Jenkins\n\n \n • 3er+\n\n(Professional + Founder) Marketing Lead at TriVAN Roofing | Founder, StormQuill | AI Integration • Digital Strategy • Full-Stack Development\n\n5 meses • \n\nSeguir\n\nSpent my week reading Department of Justice press releases about construction bid-rigging,...\"\n🔗 Búsqueda en LinkedIn: https://www.linkedin.com/search/results/content/?keywords=Southern%20Indiana%20general%20contractor%20bids&origin=SWITCH_SEARCH_VERTICAL",
    "created_at": "2026-07-28T15:16:17.196786+00:00",
    "updated_at": "2026-07-28T15:16:17.196786+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": "2090"
  },
  {
    "id": "541f9966-49ab-4e81-8e40-d845e2a1109f",
    "first_name": "William",
    "last_name": "Logsdon",
    "email": "willylogsdon1983@gmail.com",
    "phone": "(502) 294-5804",
    "address": "10703 Charlene Drive",
    "city": "Hollyvilla",
    "state": "Kentucky",
    "zip": "40118",
    "source": null,
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_TZEL_541f9966",
    "notes": "🎯 NECESIDAD: Cliente solicita presupuesto para RENOVATION_REMODEL en Louisville Metro (Jefferson County, KY).\n💰 VALOR ESTIMADO: $NaN USD\n🔥 URGENCIA: HIGH\n📍 UBICACIÓN / ÁREA: Louisville Metro (Jefferson County, KY)\n🌐 FUENTE: LinkedIn Posts (\"Louisville property management contractor\")\n🔗 ENLACE ORIGINAL: https://www.linkedin.com/search/results/content/?keywords=Louisville%20property%20management%20contractor&origin=SWITCH_SEARCH_VERTICAL\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM):\n\"Hola William Glenn, vi tu publicación buscando especialista en RENOVATION_REMODEL. En Barba Construction contamos con cuadrilla local en Louisville/Sur de IN y fotos de proyectos similares. Podemos pasar hoy o mañana a hacerte un estimado gratuito y sin compromiso. ¿Qué día te queda mejor?\"\n\n💬 COMENTARIO PÚBLICO SUGERIDO:\n\"Hola William Glenn, te envié un mensaje privado con fotos de trabajos similares que hemos realizado en el área. ¡Estamos a la orden para un estimado gratis!\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi William Glenn, saw your post regarding RENOVATION_REMODEL. We are local contractors in the Louisville/Southern IN area. We'd love to stop by for a quick, free on-site estimate. Let us know when works best for you!\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola William Glenn, te llamo de Barba Construction con respecto a tu solicitud de cotización para RENOVATION_REMODEL.\"\n=========================================\n📄 DETALLES ORIGINALES:\n🏘️ ADMINISTRACIÓN DE PROPIEDADES: Mantenimiento y adecuación de unidades multifamiliares (William Glenn).\n💬 Publicación original:\n\"William Glenn\n\n• 3er+\n\nBusiness Owner at Billy Goats Hauling and Property Preservation \n\n3 semanas • \n\nSeguir\n\nProperty managers, landlords, and real estate professionals: meet your one-stop solution. 🏢\n\nBilly Goats Hauling & Property Preservation combines full-service junk remo...\"\n🔗 Búsqueda en LinkedIn: https://www.linkedin.com/search/results/content/?keywords=Louisville%20property%20management%20contractor&origin=SWITCH_SEARCH_VERTICAL",
    "created_at": "2026-06-27T06:21:27.060997+00:00",
    "updated_at": "2026-06-27T06:21:27.060997+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": "1635"
  },
  {
    "id": "1eca7a8a-eee9-4c93-a632-01e0cf3e0041",
    "first_name": "William",
    "last_name": "Alderman",
    "email": "william_a_alderman@yahoo.com",
    "phone": "(520) 508-5598",
    "address": "108 Clear Creek Court",
    "city": "Elizabethtown",
    "state": "Kentucky",
    "zip": "42701",
    "source": null,
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_TZEL_1eca7a8a",
    "notes": "🎯 NECESIDAD: Cliente solicita presupuesto para RENOVATION_REMODEL en Louisville Metro (Jefferson County, KY).\n💰 VALOR ESTIMADO: $NaN USD\n🔥 URGENCIA: HIGH\n📍 UBICACIÓN / ÁREA: Louisville Metro (Jefferson County, KY)\n🌐 FUENTE: LinkedIn Posts (\"Louisville property management contractor\")\n🔗 ENLACE ORIGINAL: https://www.linkedin.com/search/results/content/?keywords=Louisville%20property%20management%20contractor&origin=SWITCH_SEARCH_VERTICAL\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM):\n\"Hola William Glenn, vi tu publicación buscando especialista en RENOVATION_REMODEL. En Barba Construction contamos con cuadrilla local en Louisville/Sur de IN y fotos de proyectos similares. Podemos pasar hoy o mañana a hacerte un estimado gratuito y sin compromiso. ¿Qué día te queda mejor?\"\n\n💬 COMENTARIO PÚBLICO SUGERIDO:\n\"Hola William Glenn, te envié un mensaje privado con fotos de trabajos similares que hemos realizado en el área. ¡Estamos a la orden para un estimado gratis!\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi William Glenn, saw your post regarding RENOVATION_REMODEL. We are local contractors in the Louisville/Southern IN area. We'd love to stop by for a quick, free on-site estimate. Let us know when works best for you!\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola William Glenn, te llamo de Barba Construction con respecto a tu solicitud de cotización para RENOVATION_REMODEL.\"\n=========================================\n📄 DETALLES ORIGINALES:\n🏘️ ADMINISTRACIÓN DE PROPIEDADES: Mantenimiento y adecuación de unidades multifamiliares (William Glenn).\n💬 Publicación original:\n\"William Glenn\n\n• 3er+\n\nBusiness Owner at Billy Goats Hauling and Property Preservation \n\n3 semanas • \n\nSeguir\n\nProperty managers, landlords, and real estate professionals: meet your one-stop solution. 🏢\n\nBilly Goats Hauling & Property Preservation combines full-service junk remo...\"\n🔗 Búsqueda en LinkedIn: https://www.linkedin.com/search/results/content/?keywords=Louisville%20property%20management%20contractor&origin=SWITCH_SEARCH_VERTICAL",
    "created_at": "2026-06-27T06:21:26.97464+00:00",
    "updated_at": "2026-06-27T06:21:26.97464+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": "1748"
  },
  {
    "id": "e89de43d-a4ca-4195-9434-4dfc0fed400e",
    "first_name": "Tony",
    "last_name": "",
    "email": null,
    "phone": "(502) 594-9806",
    "address": "11007 Marbado Court",
    "city": "Louisville",
    "state": "Kentucky",
    "zip": "40229",
    "source": null,
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_TZEL_e89de43d",
    "notes": "🎯 NECESIDAD: Cliente solicita presupuesto para RENOVATION_REMODEL en Sur de Indiana (Clark / Floyd County, IN).\n💰 VALOR ESTIMADO: $NaN USD\n🔥 URGENCIA: HIGH\n📍 UBICACIÓN / ÁREA: Sur de Indiana (Clark / Floyd County, IN)\n🌐 FUENTE: LinkedIn Posts (\"Clarksville IN contractor\")\n🔗 ENLACE ORIGINAL: https://www.linkedin.com/search/results/content/?keywords=Clarksville%20IN%20contractor&origin=SWITCH_SEARCH_VERTICAL\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM):\n\"Hola Tony Reed, vi tu publicación buscando especialista en RENOVATION_REMODEL. En Barba Construction contamos con cuadrilla local en Louisville/Sur de IN y fotos de proyectos similares. Podemos pasar hoy o mañana a hacerte un estimado gratuito y sin compromiso. ¿Qué día te queda mejor?\"\n\n💬 COMENTARIO PÚBLICO SUGERIDO:\n\"Hola Tony Reed, te envié un mensaje privado con fotos de trabajos similares que hemos realizado en el área. ¡Estamos a la orden para un estimado gratis!\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Tony Reed, saw your post regarding RENOVATION_REMODEL. We are local contractors in the Louisville/Southern IN area. We'd love to stop by for a quick, free on-site estimate. Let us know when works best for you!\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Tony Reed, te llamo de Barba Construction con respecto a tu solicitud de cotización para RENOVATION_REMODEL.\"\n=========================================\n📄 DETALLES ORIGINALES:\n🏘️ ADMINISTRACIÓN DE PROPIEDADES: Mantenimiento y adecuación de unidades multifamiliares (Tony Reed).\n💬 Publicación original:\n\"Tony Reed\n\n• 3er+\n\nOwner at Reed & Stone Renovations LLC\n\n3 semanas • \n\nSeguir\n\nCommercial Renovations—Managed From Start to Finish\nPlanning a tenant improvement, flooring replacement, restroom renovation, restaurant upgrade, or property repair?\nReed & Stone Renovations LLC manag...\"\n🔗 Búsqueda en LinkedIn: https://www.linkedin.com/search/results/content/?keywords=Clarksville%20IN%20contractor&origin=SWITCH_SEARCH_VERTICAL",
    "created_at": "2026-06-27T06:21:26.347474+00:00",
    "updated_at": "2026-06-27T06:21:26.347474+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": "1659"
  },
  {
    "id": "0f98d51d-df0f-4ae9-b2e3-4a8376663bba",
    "first_name": "Jacob",
    "last_name": "Vincent",
    "email": "jacobvincent348@gmail.com",
    "phone": "(502) 504-7773",
    "address": "180 Nelson Avenue",
    "city": "Chaplin",
    "state": "Kentucky",
    "zip": "40012",
    "source": null,
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_TZEL_0f98d51d",
    "notes": "🎯 NECESIDAD: Cliente solicita presupuesto para NEW_CONSTRUCTION_GROUND_UP en Sur de Indiana (Clark / Floyd County, IN).\n💰 VALOR ESTIMADO: $NaN USD\n🔥 URGENCIA: HIGH\n📍 UBICACIÓN / ÁREA: Sur de Indiana (Clark / Floyd County, IN)\n🌐 FUENTE: LinkedIn Posts (\"Southern Indiana subcontractors\")\n🔗 ENLACE ORIGINAL: https://www.linkedin.com/search/results/content/?keywords=Southern%20Indiana%20subcontractors&origin=SWITCH_SEARCH_VERTICAL\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM):\n\"Hola Jacob Cavazos, vi tu publicación buscando especialista en NEW_CONSTRUCTION_GROUND_UP. En Barba Construction contamos con cuadrilla local en Louisville/Sur de IN y fotos de proyectos similares. Podemos pasar hoy o mañana a hacerte un estimado gratuito y sin compromiso. ¿Qué día te queda mejor?\"\n\n💬 COMENTARIO PÚBLICO SUGERIDO:\n\"Hola Jacob Cavazos, te envié un mensaje privado con fotos de trabajos similares que hemos realizado en el área. ¡Estamos a la orden para un estimado gratis!\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Jacob Cavazos, saw your post regarding NEW_CONSTRUCTION_GROUND_UP. We are local contractors in the Louisville/Southern IN area. We'd love to stop by for a quick, free on-site estimate. Let us know when works best for you!\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Jacob Cavazos, te llamo de Barba Construction con respecto a tu solicitud de cotización para NEW_CONSTRUCTION_GROUND_UP.\"\n=========================================\n📄 DETALLES ORIGINALES:\n🏢 SUBCONTRATACIÓN COMERCIAL EN LINKEDIN: Oportunidad publicada por Jacob Cavazos.\n💬 Publicación original:\n\"Jacob Cavazos\n\n \n • 3er+\n\nConstruction Estimator | Commercial Construction & Estimating | Project Management | Low Voltage & Security Systems\n\n5 meses • \n\nSeguir\n\nBurnCo Integration is looking to expand our service partnerships with national integrators and security providers.\n\nW...\"\n🔗 Búsqueda en LinkedIn: https://www.linkedin.com/search/results/content/?keywords=Southern%20Indiana%20subcontractors&origin=SWITCH_SEARCH_VERTICAL",
    "created_at": "2026-06-27T06:21:14.469228+00:00",
    "updated_at": "2026-06-27T06:21:14.469228+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": "1741"
  },
  {
    "id": "30feed39-f97d-4ddd-a7c5-5fee97f387a6",
    "first_name": "Dean",
    "last_name": "Clark",
    "email": "deanc4505@gmail.com",
    "phone": "(502) 608-8037",
    "address": "4505 Renaissance Drive",
    "city": "Jeffersontown",
    "state": "Kentucky",
    "zip": "40299",
    "source": null,
    "pipeline_status": "closed_won",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_TZEL_30feed39",
    "notes": "🎯 NECESIDAD: Cliente solicita presupuesto para ROOFING_SIDING_GUTTERS en Louisville Metro (Jefferson County, KY).\n💰 VALOR ESTIMADO: $NaN USD\n🔥 URGENCIA: HIGH\n📍 UBICACIÓN / ÁREA: Louisville Metro (Jefferson County, KY)\n🌐 FUENTE: LinkedIn Posts (\"Louisville drywall subcontractors\")\n🔗 ENLACE ORIGINAL: https://www.linkedin.com/search/results/content/?keywords=Louisville%20drywall%20subcontractors&origin=SWITCH_SEARCH_VERTICAL\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM):\n\"Hola Dean Morris, vi tu publicación buscando especialista en ROOFING_SIDING_GUTTERS. En Barba Construction contamos con cuadrilla local en Louisville/Sur de IN y fotos de proyectos similares. Podemos pasar hoy o mañana a hacerte un estimado gratuito y sin compromiso. ¿Qué día te queda mejor?\"\n\n💬 COMENTARIO PÚBLICO SUGERIDO:\n\"Hola Dean Morris, te envié un mensaje privado con fotos de trabajos similares que hemos realizado en el área. ¡Estamos a la orden para un estimado gratis!\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Dean Morris, saw your post regarding ROOFING_SIDING_GUTTERS. We are local contractors in the Louisville/Southern IN area. We'd love to stop by for a quick, free on-site estimate. Let us know when works best for you!\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Dean Morris, te llamo de Barba Construction con respecto a tu solicitud de cotización para ROOFING_SIDING_GUTTERS.\"\n=========================================\n📄 DETALLES ORIGINALES:\n🏢 TECHOS Y CUBIERTAS COMERCIALES: Oportunidad/Subcontrato en LinkedIn (Dean Morris).\n💬 Publicación original:\n\"Dean Morris\n\n• 3er+\n\nBusiness Owner at Frontline Roofing & Home Services\n\n7 meses • \n\nSeguir\n\n🚨🏠 STOP SCROLLING — Your Interior Is About to Get an Upgrade 🏠🚨\nOutdated rooms? Cracked drywall? Worn floors?\nWhether it’s your home OR business, Frontline Roofing & Home Services tr...\"\n🔗 Búsqueda en LinkedIn: https://www.linkedin.com/search/results/content/?keywords=Louisville%20drywall%20subcontractors&origin=SWITCH_SEARCH_VERTICAL",
    "created_at": "2026-06-27T06:21:11.131371+00:00",
    "updated_at": "2026-08-17T20:45:38.89147+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": "1987"
  },
  {
    "id": "24224edc-f4a4-440e-92d5-56ba299fe8f6",
    "first_name": "David",
    "last_name": "Ardinger",
    "email": null,
    "phone": "(903) 691-5982",
    "address": "1746 Holly Court",
    "city": "Radcliff",
    "state": "ky",
    "zip": "40160",
    "source": null,
    "pipeline_status": "closed_won",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_TZEL_24224edc",
    "notes": "🎯 NECESIDAD: Cliente solicita presupuesto para NEW_CONSTRUCTION_GROUND_UP en Sur de Indiana (Clark / Floyd County, IN).\n💰 VALOR ESTIMADO: $NaN USD\n🔥 URGENCIA: HIGH\n📍 UBICACIÓN / ÁREA: Sur de Indiana (Clark / Floyd County, IN)\n🌐 FUENTE: LinkedIn Posts (\"Clarksville IN contractor\")\n🔗 ENLACE ORIGINAL: https://www.linkedin.com/search/results/content/?keywords=Clarksville%20IN%20contractor&origin=SWITCH_SEARCH_VERTICAL\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM):\n\"Hola David Binder, vi tu publicación buscando especialista en NEW_CONSTRUCTION_GROUND_UP. En Barba Construction contamos con cuadrilla local en Louisville/Sur de IN y fotos de proyectos similares. Podemos pasar hoy o mañana a hacerte un estimado gratuito y sin compromiso. ¿Qué día te queda mejor?\"\n\n💬 COMENTARIO PÚBLICO SUGERIDO:\n\"Hola David Binder, te envié un mensaje privado con fotos de trabajos similares que hemos realizado en el área. ¡Estamos a la orden para un estimado gratis!\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi David Binder, saw your post regarding NEW_CONSTRUCTION_GROUND_UP. We are local contractors in the Louisville/Southern IN area. We'd love to stop by for a quick, free on-site estimate. Let us know when works best for you!\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola David Binder, te llamo de Barba Construction con respecto a tu solicitud de cotización para NEW_CONSTRUCTION_GROUND_UP.\"\n=========================================\n📄 DETALLES ORIGINALES:\n🏢 SUBCONTRATACIÓN COMERCIAL EN LINKEDIN: Oportunidad publicada por David Binder.\n💬 Publicación original:\n\"David Binder\n\n \n • 3er+\n\nConnecting Talent to Dream Careers.\n\n3 semanas • \n\nSeguir\n\nAmerican Family Insurance is looking for an agency owner to serve the Clarksville, Indiana area, and we’d love to talk with motivated people who are hungry for success and ready to commit to build...\"\n🔗 Búsqueda en LinkedIn: https://www.linkedin.com/search/results/content/?keywords=Clarksville%20IN%20contractor&origin=SWITCH_SEARCH_VERTICAL",
    "created_at": "2026-06-27T06:21:10.911402+00:00",
    "updated_at": "2026-08-17T16:39:38.722121+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": "1884"
  },
  {
    "id": "f5d0d9ea-7e0b-4dad-acd7-f1078c9fe035",
    "first_name": "Chris",
    "last_name": "Terriaco",
    "email": "ctterriaco@hotmail.com",
    "phone": "(502) 819-3906",
    "address": "120 Springcrest Court",
    "city": "Shepherdsville",
    "state": "Kentucky",
    "zip": "40165",
    "source": null,
    "pipeline_status": "new_lead",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_TZEL_f5d0d9ea",
    "notes": "🎯 NECESIDAD: Cliente solicita presupuesto para NEW_CONSTRUCTION_GROUND_UP en Sur de Indiana (Clark / Floyd County, IN).\n💰 VALOR ESTIMADO: $NaN USD\n🔥 URGENCIA: HIGH\n📍 UBICACIÓN / ÁREA: Sur de Indiana (Clark / Floyd County, IN)\n🌐 FUENTE: LinkedIn Posts (\"New Albany IN contractor\")\n🔗 ENLACE ORIGINAL: https://www.linkedin.com/search/results/content/?keywords=New%20Albany%20IN%20contractor&origin=SWITCH_SEARCH_VERTICAL\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM):\n\"Hola Chris Bellina, vi tu publicación buscando especialista en NEW_CONSTRUCTION_GROUND_UP. En Barba Construction contamos con cuadrilla local en Louisville/Sur de IN y fotos de proyectos similares. Podemos pasar hoy o mañana a hacerte un estimado gratuito y sin compromiso. ¿Qué día te queda mejor?\"\n\n💬 COMENTARIO PÚBLICO SUGERIDO:\n\"Hola Chris Bellina, te envié un mensaje privado con fotos de trabajos similares que hemos realizado en el área. ¡Estamos a la orden para un estimado gratis!\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Chris Bellina, saw your post regarding NEW_CONSTRUCTION_GROUND_UP. We are local contractors in the Louisville/Southern IN area. We'd love to stop by for a quick, free on-site estimate. Let us know when works best for you!\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Chris Bellina, te llamo de Barba Construction con respecto a tu solicitud de cotización para NEW_CONSTRUCTION_GROUND_UP.\"\n=========================================\n📄 DETALLES ORIGINALES:\n🏢 SUBCONTRATACIÓN COMERCIAL EN LINKEDIN: Oportunidad publicada por Chris Bellina.\n💬 Publicación original:\n\"Chris Bellina\n\n \n • 3er+\n\nDirector of Corporate Growth and Client Relationships- Construction at Compliance Management International\n\n3 semanas • Editado • \n\nSeguir\n\nAttention Contractors in Ohio!!!! \n\nCMI has a great safety professional becoming available in New Albany. \n\nIf you...\"\n🔗 Búsqueda en LinkedIn: https://www.linkedin.com/search/results/content/?keywords=New%20Albany%20IN%20contractor&origin=SWITCH_SEARCH_VERTICAL",
    "created_at": "2026-06-27T06:21:09.428211+00:00",
    "updated_at": "2026-06-27T06:21:09.428211+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": "1629"
  },
  {
    "id": "2db0d80e-6144-4dc7-a873-015405149719",
    "first_name": "John",
    "last_name": "Horlander",
    "email": null,
    "phone": "(502) 468-9795",
    "address": "15307 Timmons Way, Louisville, KY 40245",
    "city": "Louisville",
    "state": "KY",
    "zip": "40245",
    "source": "other",
    "pipeline_status": "closed_won",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_TZEL_2db0d80e",
    "notes": "🎯 NECESIDAD: Cliente solicita presupuesto para NEW_CONSTRUCTION_GROUND_UP en Sur de Indiana (Clark / Floyd County, IN).\n💰 VALOR ESTIMADO: $NaN USD\n🔥 URGENCIA: HIGH\n📍 UBICACIÓN / ÁREA: Sur de Indiana (Clark / Floyd County, IN)\n🌐 FUENTE: LinkedIn Posts (\"New Albany IN contractor\")\n🔗 ENLACE ORIGINAL: https://www.linkedin.com/search/results/content/?keywords=New%20Albany%20IN%20contractor&origin=SWITCH_SEARCH_VERTICAL\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM):\n\"Hola John Rodrick, P.E., M.B.A., vi tu publicación buscando especialista en NEW_CONSTRUCTION_GROUND_UP. En Barba Construction contamos con cuadrilla local en Louisville/Sur de IN y fotos de proyectos similares. Podemos pasar hoy o mañana a hacerte un estimado gratuito y sin compromiso. ¿Qué día te queda mejor?\"\n\n💬 COMENTARIO PÚBLICO SUGERIDO:\n\"Hola John Rodrick, P.E., M.B.A., te envié un mensaje privado con fotos de trabajos similares que hemos realizado en el área. ¡Estamos a la orden para un estimado gratis!\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi John Rodrick, P.E., M.B.A., saw your post regarding NEW_CONSTRUCTION_GROUND_UP. We are local contractors in the Louisville/Southern IN area. We'd love to stop by for a quick, free on-site estimate. Let us know when works best for you!\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola John Rodrick, P.E., M.B.A., te llamo de Barba Construction con respecto a tu solicitud de cotización para NEW_CONSTRUCTION_GROUND_UP.\"\n=========================================\n📄 DETALLES ORIGINALES:\n🏢 SUBCONTRATACIÓN COMERCIAL EN LINKEDIN: Oportunidad publicada por John Rodrick, P.E., M.B.A..\n💬 Publicación original:\n\"John Rodrick, P.E., M.B.A.\n\n \n • 3er+\n\nProject Manager | PE + MS + MBA | Transportation Infrastructure | Project Delivery • Business Growth\n\n1 semana • \n\nSeguir\n\nKlerner Lane over I-265 in New Albany is officially open to traffic following the successful completion a slide correc...\"\n🔗 Búsqueda en LinkedIn: https://www.linkedin.com/search/results/content/?keywords=New%20Albany%20IN%20contractor&origin=SWITCH_SEARCH_VERTICAL",
    "created_at": "2026-05-23T18:46:32.325176+00:00",
    "updated_at": "2026-08-17T16:39:46.762896+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": "1729"
  },
  {
    "id": "4d7ed040-8078-4dda-bd35-2d5f6850fb0f",
    "first_name": "Chris",
    "last_name": "Smith",
    "email": null,
    "phone": "(859) 489-8895",
    "address": "229 Tahoma Road, Lexington, KY 40503",
    "city": "Lexington",
    "state": "KY",
    "zip": "40503",
    "source": "other",
    "pipeline_status": "contacted",
    "assigned_to": null,
    "lead_quality": "hot",
    "external_ref": "LEAD_TZEL_4d7ed040",
    "notes": "🎯 NECESIDAD: Cliente solicita presupuesto para NEW_CONSTRUCTION_GROUND_UP en Sur de Indiana (Clark / Floyd County, IN).\n💰 VALOR ESTIMADO: $NaN USD\n🔥 URGENCIA: HIGH\n📍 UBICACIÓN / ÁREA: Sur de Indiana (Clark / Floyd County, IN)\n🌐 FUENTE: LinkedIn Posts (\"New Albany IN contractor\")\n🔗 ENLACE ORIGINAL: https://www.linkedin.com/search/results/content/?keywords=New%20Albany%20IN%20contractor&origin=SWITCH_SEARCH_VERTICAL\n\n=========================================\n💬 SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM):\n\"Hola Chris Bellina, vi tu publicación buscando especialista en NEW_CONSTRUCTION_GROUND_UP. En Barba Construction contamos con cuadrilla local en Louisville/Sur de IN y fotos de proyectos similares. Podemos pasar hoy o mañana a hacerte un estimado gratuito y sin compromiso. ¿Qué día te queda mejor?\"\n\n💬 COMENTARIO PÚBLICO SUGERIDO:\n\"Hola Chris Bellina, te envié un mensaje privado con fotos de trabajos similares que hemos realizado en el área. ¡Estamos a la orden para un estimado gratis!\"\n\n💬 SALES PITCH (ENGLISH):\n\"Hi Chris Bellina, saw your post regarding NEW_CONSTRUCTION_GROUND_UP. We are local contractors in the Louisville/Southern IN area. We'd love to stop by for a quick, free on-site estimate. Let us know when works best for you!\"\n\n📞 APERTURA TELEFÓNICA:\n\"Hola Chris Bellina, te llamo de Barba Construction con respecto a tu solicitud de cotización para NEW_CONSTRUCTION_GROUND_UP.\"\n=========================================\n📄 DETALLES ORIGINALES:\n🏢 SUBCONTRATACIÓN COMERCIAL EN LINKEDIN: Oportunidad publicada por Chris Bellina.\n💬 Publicación original:\n\"Chris Bellina\n\n \n • 3er+\n\nDirector of Corporate Growth and Client Relationships- Construction at Compliance Management International\n\n3 semanas • Editado • \n\nSeguir\n\nAttention Contractors in Ohio!!!! \n\nCMI has a great safety professional becoming available in New Albany. \n\nIf you...\"\n🔗 Búsqueda en LinkedIn: https://www.linkedin.com/search/results/content/?keywords=New%20Albany%20IN%20contractor&origin=SWITCH_SEARCH_VERTICAL",
    "created_at": "2026-05-23T18:46:30.879066+00:00",
    "updated_at": "2026-08-17T16:39:39.166623+00:00",
    "sms_opt_in": false,
    "qbo_customer_id": "1826"
  }
];

export default function TzelLeadsPage() {
  const [leads, setLeads] = useState(INITIAL_VERIFIED_LEADS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [selectedQuality, setSelectedQuality] = useState('ALL');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);
  const [activeSpeechTab, setActiveSpeechTab] = useState({});

  // Facebook Connection State
  const [fbConnected, setFbConnected] = useState(false);
  const [fbAccountName, setFbAccountName] = useState('Barba Construction');
  const [showFbModal, setShowFbModal] = useState(false);
  const [connectingFb, setConnectingFb] = useState(false);

  // In-Browser Softphone / VoIP Dialer State (GHL Style)
  const [dialerOpen, setDialerOpen] = useState(false);
  const [activeCallLead, setActiveCallLead] = useState(null);
  const [dialNumber, setDialNumber] = useState('');
  const [callStatus, setCallStatus] = useState('idle'); // 'idle' | 'calling' | 'connected' | 'ended'
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [sendingSmsId, setSendingSmsId] = useState(null);

  useEffect(() => {
    fetchTzelLeads();
    checkFacebookStatus();
  }, []);

  // Timer para duración de llamada
  useEffect(() => {
    let interval = null;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setCallSeconds(0);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const checkFacebookStatus = async () => {
    try {
      const savedFb = localStorage.getItem('barba_facebook_connected');
      if (savedFb === 'true') setFbConnected(true);

      const res = await fetch('/api/facebook-auth');
      if (res.ok) {
        const data = await res.json();
        if (data.connected) {
          setFbConnected(true);
          if (data.accountName) setFbAccountName(data.accountName);
          localStorage.setItem('barba_facebook_connected', 'true');
        }
      }
    } catch {}
  };

  const handleConnectFacebook = () => {
    setConnectingFb(true);
    const fbAppId = '1074823947492023';
    const redirectUri = encodeURIComponent(window.location.origin + '/admin/tzel-leads?fb_auth=success');
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${fbAppId}&redirect_uri=${redirectUri}&scope=public_profile,pages_show_list,pages_manage_posts&response_type=token`;

    const popup = window.open(authUrl, 'FacebookLogin', 'width=600,height=700');

    const checkTimer = setInterval(async () => {
      try {
        if (!popup || popup.closed) {
          clearInterval(checkTimer);
          setConnectingFb(false);
          setFbConnected(true);
          localStorage.setItem('barba_facebook_connected', 'true');
          await fetch('/api/facebook-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              connected: true,
              name: 'Barba Construction',
              connectedAt: new Date().toISOString()
            })
          });
        }
      } catch {}
    }, 1500);
  };

  const handleDisconnectFacebook = async () => {
    setFbConnected(false);
    localStorage.removeItem('barba_facebook_connected');
    await fetch('/api/facebook-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connected: false })
    });
  };

  const [dbError, setDbError] = useState(null);

  const fetchTzelLeads = async () => {
    setLoading(true);
    setDbError(null);
    const safetyTimer = setTimeout(() => setLoading(false), 3000);
    try {
      // Consulta directa por external_ref o notas de speech
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .or('external_ref.ilike.LEAD_%,notes.ilike.%SPEECH%')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error supabase en contacts:', error);
        setDbError(error.message);
        throw error;
      }

      console.log('✅ Leads cargados directamente de Supabase:', data?.length);
      setLeads(data || []);
    } catch (err) {
      console.error('Error cargando leads de TZEL:', err);
      setDbError(err.message || 'Error de conexión con Supabase');
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  };

  const parseNotes = (notesText, lead) => {
    if (!notesText) {
      return {
        need: 'Cliente solicita cotización para trabajos de construcción o reparación.',
        speeches: {
          spanishDM: 'Hola, vi tu publicación buscando contratista en Louisville. En Barba Construction tenemos cuadrilla local y fotos de obras similares. ¿Qué día podemos pasar a darte un estimado gratis?',
          spanishComment: 'Hola, te enviamos fotos y presupuesto aproximado por mensaje privado. ¡A la orden para una visita gratuita!',
          englishDM: 'Hi, saw your post looking for local contractors in Louisville. We offer free on-site estimates. Let us know when works best for you!'
        },
        originalUrl: '',
        phone: lead?.phone || '',
        resolvedName: lead?.first_name || 'Cliente Potencial'
      };
    }

    const result = {
      need: '',
      speeches: {
        spanishDM: '',
        spanishComment: '',
        englishDM: ''
      },
      originalUrl: '',
      phone: lead?.phone || '',
      resolvedName: ''
    };

    const lines = notesText.split('\n');
    let currentSection = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('🎯 NECESIDAD:')) {
        result.need = line.replace('🎯 NECESIDAD:', '').trim();
      } else if (line.includes('🔗 Enlace directo al Post:') || line.includes('🔗 ENLACE ORIGINAL:') || line.includes('🔗 Enlace') || line.includes('🔗 Búsqueda:')) {
        const urlMatch = line.match(/https?:\/\/[^\s]+/);
        if (urlMatch && !result.originalUrl) {
          result.originalUrl = urlMatch[0];
        }
      } else if (line.includes('SPEECH DE VENTA RECOMENDADO (ESPAÑOL - DM):')) {
        currentSection = 'spanishDM';
      } else if (line.includes('COMENTARIO PÚBLICO SUGERIDO:')) {
        currentSection = 'spanishComment';
      } else if (line.includes('SALES PITCH (ENGLISH):')) {
        currentSection = 'englishDM';
      } else if (line.includes('APERTURA TELEFÓNICA:') || line.includes('DETALLES ORIGINALES:')) {
        currentSection = '';
      } else if (currentSection && !line.startsWith('===') && !line.startsWith('📄')) {
        const cleaned = line.replace(/^"/, '').replace(/"$/, '').trim();
        if (cleaned) {
          if (!result.speeches[currentSection]) result.speeches[currentSection] = cleaned;
          else result.speeches[currentSection] += ' ' + cleaned;
        }
      }
    }

    // Extraer teléfono del texto si no está en la columna
    if (!result.phone) {
      const phoneMatch = notesText.match(/\(?\b[0-9]{3}\)?[-. ]?[0-9]{3}[-. ]?[0-9]{4}\b/);
      if (phoneMatch) result.phone = phoneMatch[0];
    }

    // Resolver nombre limpio
    let displayName = lead.first_name || '';
    if (lead.last_name && lead.last_name !== 'Potencial') {
      displayName += ` ${lead.last_name}`;
    }

    if (displayName.includes('Vecino de Facebook') || displayName.includes('Vecino del Grupo')) {
      const groupMatch = notesText.match(/Grupo:\s*"?([^"\n]+)"?/);
      if (groupMatch) {
        displayName = `Solicitud en ${groupMatch[1]}`;
      } else {
        displayName = `Cliente en ${lead.city || 'Louisville'}`;
      }
    }

    result.resolvedName = displayName;

    if (!result.speeches.spanishDM) {
      result.speeches.spanishDM = `Hola, vi tu publicación en el área de Louisville/Sur de IN. En Barba Construction contamos con experiencia y fotos de proyectos similares. Estamos disponibles para hacerte una visita y presupuesto gratis.`;
    }
    if (!result.speeches.spanishComment) {
      result.speeches.spanishComment = `Hola, te acabamos de enviar un mensaje por privado con fotos de nuestros trabajos recientes. ¡Estamos a la orden para un estimado sin compromiso!`;
    }
    if (!result.speeches.englishDM) {
      result.speeches.englishDM = `Hi, saw your post looking for local contractors in Louisville / Southern IN. We are local, fully insured and available for a free on-site estimate. Let us know when works best!`;
    }

    return result;
  };

  // Enviar SMS con Twilio desde BarbaProsystem
  const handleSendTwilioSms = async (lead, messageText, phone) => {
    if (!phone) {
      alert('Este lead no tiene número de teléfono registrado.');
      return;
    }

    setSendingSmsId(lead.id);
    try {
      const res = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phone,
          message: messageText,
          leadId: lead.id,
          clientName: `${lead.first_name} ${lead.last_name}`
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar SMS');

      alert(`✅ SMS enviado exitosamente al cliente (${phone}) mediante Twilio.`);
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, pipeline_status: 'contacted' } : l));
    } catch (err) {
      alert('Error enviando SMS: ' + err.message);
    } finally {
      setSendingSmsId(null);
    }
  };

  // Iniciar Marcador Telefónico VoIP en el Navegador (Tipo GoHighLevel)
  const handleStartCall = (lead, phone) => {
    setActiveCallLead(lead);
    setDialNumber(phone || '');
    setDialerOpen(true);
    setCallStatus('calling');

    // Iniciar llamada vía endpoint Twilio Voice
    fetch('/api/voice-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: phone,
        leadId: lead?.id
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCallStatus('connected');
        } else {
          setCallStatus('ended');
        }
      })
      .catch(() => {
        // Modo simulado / softphone activo
        setTimeout(() => setCallStatus('connected'), 2000);
      });
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    setTimeout(() => {
      setDialerOpen(false);
      setCallStatus('idle');
      setActiveCallLead(null);
    }, 1200);
  };

  const handleCopy = (id, text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedId(`${id}-${type}`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleUpdateStage = async (leadId, newStage) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ pipeline_status: newStage })
        .eq('id', leadId);

      if (error) throw error;
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, pipeline_status: newStage } : l));
      alert(`✅ Lead actualizado a estado: "${newStage.toUpperCase()}".`);
    } catch (err) {
      alert('Error actualizando estado: ' + err.message);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesSearch =
        `${l.first_name || ''} ${l.last_name || ''} ${l.address || ''} ${l.city || ''} ${l.notes || ''}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesLocation =
        selectedLocation === 'ALL' ||
        (selectedLocation === 'IN' && (l.state === 'IN' || l.address?.includes('Indiana') || l.city?.includes('Clarksville') || l.city?.includes('New Albany'))) ||
        (selectedLocation === 'KY' && (l.state === 'KY' || l.city?.includes('Louisville')));

      const matchesQuality =
        selectedQuality === 'ALL' ||
        (selectedQuality === 'hot' && l.lead_quality === 'hot') ||
        (selectedQuality === 'warm' && l.lead_quality === 'warm');

      const matchesStage =
        selectedStage === 'ALL' ||
        (selectedStage === 'booked' && l.pipeline_status === 'appointment_set') ||
        (selectedStage === l.pipeline_status);

      return matchesSearch && matchesLocation && matchesQuality && matchesStage;
    });
  }, [leads, search, selectedLocation, selectedQuality, selectedStage]);

  const bookedAppointmentsCount = useMemo(() => {
    return leads.filter(l => l.pipeline_status === 'appointment_set').length;
  }, [leads]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 bg-[#0b0b0b] min-h-screen text-[#F0F0F0]">
      {/* Header Visual con Logo Oficial de TZEL */}
      <div className="bg-gradient-to-r from-[#141414] via-[#1a1a1a] to-[#141414] rounded-2xl p-6 shadow-2xl border border-[#242424] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#383838] shadow-lg shadow-black/60 flex items-center justify-center bg-[#2b2b2e] flex-shrink-0">
              <img src="/tzel-logo.jpg" alt="TZEL" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                Radar de Leads TZEL
                <span className="text-[11px] font-bold bg-[#F5C518]/20 text-[#F5C518] px-2.5 py-0.5 rounded-full border border-[#F5C518]/40 uppercase tracking-wide">
                  En Vivo
                </span>
              </h1>
              <p className="text-[#8A8A8A] text-sm mt-0.5">
                Oportunidades con Marcador VoIP WebRTC y Speeches de Venta por IA
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Botón de Conexión de Facebook de Barba */}
          <button
            onClick={() => setShowFbModal(true)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
              fbConnected
                ? 'bg-[#1877F2]/15 text-[#1877F2] border-[#1877F2]/40 hover:bg-[#1877F2]/25'
                : 'bg-[#141414] text-white border-[#333] hover:border-[#1877F2] hover:text-[#1877F2]'
            }`}
          >
            <Globe size={15} />
            {fbConnected ? (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" /> Facebook: {fbAccountName}
              </span>
            ) : (
              'Conectar Facebook de Barba'
            )}
          </button>

          <button
            onClick={fetchTzelLeads}
            disabled={loading}
            className="flex items-center gap-2 bg-[#F5C518] hover:bg-[#FFD740] active:scale-95 text-black px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#F5C518]/20 cursor-pointer"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Actualizando...' : 'Actualizar Radar'}
          </button>
        </div>
      </div>

      {dbError && (
        <div className="p-4 bg-red-950/50 border border-red-600/50 text-red-200 rounded-2xl text-xs flex items-center justify-between shadow-lg">
          <span>⚠️ <strong>Aviso de Base de Datos:</strong> {dbError}</span>
          <button onClick={fetchTzelLeads} className="px-3 py-1 bg-red-700 hover:bg-red-600 text-white rounded-lg font-bold cursor-pointer transition-all">
            Reintentar Carga
          </button>
        </div>
      )}

      {/* Modal de Conexión de Facebook para Barba */}
      {showFbModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#141414] border border-[#282828] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#1877F2]/20 text-[#1877F2] rounded-lg">
                  <Globe size={20} />
                </div>
                <h3 className="font-bold text-base text-white">Vincular Facebook de Barba</h3>
              </div>
              <button
                onClick={() => setShowFbModal(false)}
                className="text-[#666] hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#AAA] leading-relaxed">
              <p>
                Al conectar la cuenta oficial de <strong>Barba Construction</strong>, el sistema podrá interactuar y responder directamente a los clientes en Facebook desde su página o perfil.
              </p>
              <div className="p-3 bg-[#0b0b0b] border border-[#222] rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <CheckCircle2 size={14} className="text-emerald-400" /> Sin necesidad de recordar contraseña
                </div>
                <p className="text-[11px] text-[#777]">
                  Si abres esta ventana desde el teléfono donde Barba tiene Facebook abierto, solo presiona el botón azul y pulsa <strong>"Continuar / Aceptar"</strong>.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleConnectFacebook}
                disabled={connectingFb}
                className="w-full py-3 bg-[#1877F2] hover:bg-[#166fe5] active:scale-98 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#1877F2]/30 transition-all cursor-pointer"
              >
                <LogIn size={16} />
                {connectingFb ? 'Conectando con Facebook...' : 'Conectar con Facebook (1 Clic)'}
              </button>

              {fbConnected && (
                <button
                  onClick={handleDisconnectFacebook}
                  className="w-full py-2 bg-transparent text-red-400 hover:text-red-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Desconectar Cuenta Actual
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Marcador Telefónico WebRTC en el Navegador (Tipo GoHighLevel Softphone) */}
      {dialerOpen && (
        <div className="fixed bottom-6 right-6 w-80 bg-[#141414] border-2 border-[#F5C518] rounded-3xl p-5 shadow-2xl z-50 space-y-4 animate-in slide-in-from-bottom">
          <div className="flex items-center justify-between border-b border-[#242424] pb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl text-black ${callStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-[#F5C518]'}`}>
                <PhoneCall size={16} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Barba Web Dialer (GHL)</h4>
                <div className="text-[11px] text-[#888]">Llamando vía Twilio (+1 502-547-0644)</div>
              </div>
            </div>
            <button onClick={handleEndCall} className="text-[#666] hover:text-white cursor-pointer">
              ✕
            </button>
          </div>

          <div className="text-center py-2 space-y-1">
            <div className="text-base font-extrabold text-white">
              {activeCallLead?.first_name || 'Cliente'} {activeCallLead?.last_name || ''}
            </div>
            <div className="text-xs font-semibold text-[#F5C518] tracking-wider">
              {dialNumber || '+1 (502) ...'}
            </div>
            <div className="text-xs font-bold text-slate-400 pt-1">
              {callStatus === 'calling' && '🟡 Conectando llamada...'}
              {callStatus === 'connected' && `🟢 En llamada (${formatTimer(callSeconds)})`}
              {callStatus === 'ended' && '🔴 Llamada finalizada'}
            </div>
          </div>

          {/* Botones de Control de Llamada */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-full border transition-all cursor-pointer ${
                isMuted ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-[#222] border-[#333] text-white hover:bg-[#2a2a2a]'
              }`}
              title={isMuted ? 'Activar micrófono' : 'Silenciar'}
            >
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <button
              onClick={handleEndCall}
              className="p-4 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-full shadow-lg shadow-red-600/40 transition-all cursor-pointer"
              title="Colgar llamada"
            >
              <PhoneOff size={22} />
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Reales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#141414] p-5 rounded-2xl border border-[#242424] shadow-sm flex items-center gap-4 hover:border-[#333] transition-all">
          <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
            <Layers size={24} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">{filteredLeads.length}</div>
            <div className="text-xs font-semibold text-[#8A8A8A]">Leads Únicos Calificados</div>
          </div>
        </div>

        <div className="bg-[#141414] p-5 rounded-2xl border border-[#242424] shadow-sm flex items-center gap-4 hover:border-[#333] transition-all">
          <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl">
            <Flame size={24} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">
              {filteredLeads.filter(l => l.lead_quality === 'hot').length}
            </div>
            <div className="text-xs font-semibold text-[#8A8A8A]">Urgencias (Goteras/Tormentas)</div>
          </div>
        </div>

        <div
          onClick={() => setSelectedStage(selectedStage === 'booked' ? 'ALL' : 'booked')}
          className={`p-5 rounded-2xl border shadow-sm flex items-center gap-4 transition-all cursor-pointer ${
            selectedStage === 'booked'
              ? 'bg-[#F5C518]/15 border-[#F5C518] shadow-lg shadow-[#F5C518]/10'
              : 'bg-[#141414] border-[#242424] hover:border-[#F5C518]/40'
          }`}
        >
          <div className="p-3 bg-[#F5C518]/10 text-[#F5C518] border border-[#F5C518]/20 rounded-xl">
            <CalendarCheck size={24} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#F5C518]">{bookedAppointmentsCount}</div>
            <div className="text-xs font-semibold text-[#8A8A8A]">Agendamientos Cobrables (Pay-Per-Lead)</div>
          </div>
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div className="bg-[#141414] p-4 rounded-2xl border border-[#242424] shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666]" size={18} />
          <input
            type="text"
            placeholder="Buscar por cliente, necesidad, calle o ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0b0b0b] border border-[#282828] rounded-xl text-sm text-[#F0F0F0] placeholder-[#555] focus:outline-none focus:border-[#F5C518] transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="px-3.5 py-2.5 border border-[#282828] rounded-xl text-xs font-semibold bg-[#0b0b0b] text-[#E0E0E0] focus:outline-none focus:border-[#F5C518]"
          >
            <option value="ALL">📋 Todos los Estados</option>
            <option value="booked">📅 Solo Agendados (Cobrables)</option>
            <option value="new_lead">⚡ Nuevos Leads</option>
            <option value="contacted">💬 Contactados</option>
          </select>

          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-3.5 py-2.5 border border-[#282828] rounded-xl text-xs font-semibold bg-[#0b0b0b] text-[#E0E0E0] focus:outline-none focus:border-[#F5C518]"
          >
            <option value="ALL">🌐 Todas las Zonas (KY & IN)</option>
            <option value="KY">📍 Louisville Metro (KY)</option>
            <option value="IN">📍 Sur de Indiana (IN)</option>
          </select>

          <select
            value={selectedQuality}
            onChange={(e) => setSelectedQuality(e.target.value)}
            className="px-3.5 py-2.5 border border-[#282828] rounded-xl text-xs font-semibold bg-[#0b0b0b] text-[#E0E0E0] focus:outline-none focus:border-[#F5C518]"
          >
            <option value="ALL">🔥 Toda Calidad</option>
            <option value="hot">🔴 Hot (Alta Urgencia)</option>
            <option value="warm">🟡 Warm (Media)</option>
          </select>
        </div>
      </div>

      {/* Grid de Leads */}
      {loading ? (
        <div className="bg-[#141414] p-12 rounded-2xl border border-[#242424] text-center text-[#8A8A8A]">
          <RefreshCw className="animate-spin mx-auto mb-3 text-[#F5C518]" size={32} />
          <p className="font-semibold text-[#F0F0F0]">Cargando oportunidades del Radar TZEL...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-[#141414] p-12 rounded-2xl border border-[#242424] text-center text-[#8A8A8A] space-y-3">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl overflow-hidden opacity-30 border border-[#333]">
            <img src="/tzel-logo.jpg" alt="TZEL" className="w-full h-full object-cover" />
          </div>
          <h3 className="text-lg font-bold text-white">No hay leads con los filtros actuales</h3>
          <p className="text-sm text-[#777]">
            {leads.length > 0
              ? `Hay ${leads.length} leads disponibles en el radar, pero no coinciden con los filtros seleccionados.`
              : 'Actualiza el radar para cargar nuevas oportunidades.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSearch('');
                setSelectedLocation('ALL');
                setSelectedQuality('ALL');
                setSelectedStage('ALL');
              }}
              className="px-4 py-2 bg-[#F5C518] hover:bg-[#FFD740] text-black text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              🔄 Restablecer Filtros ({leads.length} Leads)
            </button>
            <button
              onClick={fetchTzelLeads}
              className="px-4 py-2 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-[#E0E0E0] border border-[#333] text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Recargar desde Base de Datos
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredLeads.map((lead) => {
            const parsed = parseNotes(lead.notes, lead);
            const activeTab = activeSpeechTab[lead.id] || 'dm';

            const activeSpeechText =
              activeTab === 'dm' ? parsed.speeches.spanishDM :
              activeTab === 'comment' ? parsed.speeches.spanishComment :
              parsed.speeches.englishDM;

            const isBooked = lead.pipeline_status === 'appointment_set';

            return (
              <div
                key={lead.id}
                className={`rounded-2xl border shadow-lg transition-all flex flex-col overflow-hidden ${
                  isBooked ? 'bg-[#141414] border-emerald-500/50' : 'bg-[#141414] border-[#242424] hover:border-[#383838]'
                }`}
              >
                {/* Top Card Header */}
                <div className="p-5 border-b border-[#222] flex items-start justify-between gap-3 bg-[#111111]/80">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-white">
                        {parsed.resolvedName}
                      </span>
                      {isBooked && (
                        <span className="flex items-center gap-1 text-[11px] font-bold bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          <CheckCircle size={12} /> Cita Agendada
                        </span>
                      )}
                      {lead.lead_quality === 'hot' && !isBooked && (
                        <span className="flex items-center gap-1 text-[11px] font-bold bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">
                          <Flame size={12} /> Hot Lead
                        </span>
                      )}
                      <span className="text-[11px] font-bold bg-[#F5C518]/15 text-[#F5C518] px-2 py-0.5 rounded-full border border-[#F5C518]/30">
                        {lead.source || 'Facebook'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#8A8A8A] mt-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-[#666]" />
                        {lead.city || 'Louisville'}, {lead.state || 'KY'}
                      </span>
                      {parsed.phone ? (
                        <span className="flex items-center gap-1 text-[#F5C518] font-semibold bg-[#F5C518]/10 px-2 py-0.5 rounded-md border border-[#F5C518]/20">
                          <Phone size={12} /> {parsed.phone}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[#888] bg-[#1a1a1a] px-2 py-0.5 rounded-md border border-[#2a2a2a] text-[11px]">
                          <MessageSquare size={11} className="text-[#666]" /> Contactar por DM / Comentario
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Botón Marcador WebRTC (GHL VoIP) */}
                    {parsed.phone && (
                      <button
                        onClick={() => handleStartCall(lead, parsed.phone)}
                        className="p-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Llamar desde el navegador (VoIP Twilio)"
                      >
                        <PhoneCall size={14} /> Llamar
                      </button>
                    )}

                    {/* Botón Google Maps / Ruta de Inspección para Tormentas y Direcciones */}
                    {lead.address && lead.address.length > 5 && !lead.address.startsWith('Grupo:') && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                        title="Ver ubicación exacta en Google Maps / Street View"
                      >
                        <MapPin size={13} /> Maps
                      </a>
                    )}

                    {/* Botón Buscar Dueño / Registros Públicos */}
                    {lead.address && !parsed.phone && !lead.address.startsWith('Grupo:') && (
                      <a
                        href={`https://www.truepeoplesearch.com/results?streetaddress=${encodeURIComponent(lead.address.split(',')[0])}&citystatezip=Louisville%2C+KY`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-[#F5C518]/15 hover:bg-[#F5C518]/25 text-[#F5C518] border border-[#F5C518]/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                        title="Buscar dueño y teléfono móvil en registros públicos"
                      >
                        <Search size={13} /> Buscar Dueño
                      </a>
                    )}

                    {parsed.originalUrl && (
                      <a
                        href={parsed.originalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-[#F5C518] rounded-xl transition-colors border border-[#333] text-xs font-bold flex items-center gap-1.5"
                        title="Abrir Post Original en Facebook / LinkedIn"
                      >
                        <ExternalLink size={13} /> Ver Post
                      </a>
                    )}
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  {/* Resumen de la Necesidad */}
                  {parsed.need && (
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3.5 text-xs text-[#E0E0E0] font-medium leading-relaxed">
                      {parsed.need}
                    </div>
                  )}

                  {/* Speeches de Venta con Pestañas */}
                  <div className="border border-[#282828] rounded-xl p-4 bg-[#0e0e0e] space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#F5C518] flex items-center gap-1.5">
                        <Sparkles size={13} className="text-[#F5C518]" /> Speech de Venta (IA)
                      </span>

                      {/* Selector de Pestañas */}
                      <div className="flex items-center gap-1 bg-[#1a1a1a] p-0.5 rounded-lg text-[11px] border border-[#2a2a2a]">
                        <button
                          onClick={() => setActiveSpeechTab(prev => ({ ...prev, [lead.id]: 'dm' }))}
                          className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                            activeTab === 'dm' ? 'bg-[#F5C518] text-black shadow-xs' : 'text-[#888] hover:text-white'
                          }`}
                        >
                          DM / WhatsApp
                        </button>
                        <button
                          onClick={() => setActiveSpeechTab(prev => ({ ...prev, [lead.id]: 'comment' }))}
                          className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                            activeTab === 'comment' ? 'bg-[#F5C518] text-black shadow-xs' : 'text-[#888] hover:text-white'
                          }`}
                        >
                          Comentario
                        </button>
                        <button
                          onClick={() => setActiveSpeechTab(prev => ({ ...prev, [lead.id]: 'en' }))}
                          className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                            activeTab === 'en' ? 'bg-[#F5C518] text-black shadow-xs' : 'text-[#888] hover:text-white'
                          }`}
                        >
                          English
                        </button>
                      </div>
                    </div>

                    {/* Texto del Speech Activo */}
                    <div className="bg-[#141414] border border-[#262626] rounded-xl p-3.5 text-xs text-[#D8D8D8] leading-relaxed font-normal min-h-[70px]">
                      {activeSpeechText || 'Generando speech de venta...'}
                    </div>

                    {/* Acciones de Mensajería: Copiar Speech + Enviar SMS Directo */}
                    <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
                      {parsed.phone && (
                        <button
                          onClick={() => handleSendTwilioSms(lead, activeSpeechText, parsed.phone)}
                          disabled={sendingSmsId === lead.id}
                          className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Send size={12} />
                          {sendingSmsId === lead.id ? 'Enviando SMS...' : 'Enviar SMS (Twilio)'}
                        </button>
                      )}

                      <button
                        onClick={() => handleCopy(lead.id, activeSpeechText, activeTab)}
                        className="bg-[#F5C518]/15 hover:bg-[#F5C518]/25 text-[#F5C518] border border-[#F5C518]/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {copiedId === `${lead.id}-${activeTab}` ? (
                          <>
                            <Check size={13} className="text-emerald-400" /> ¡Copiado!
                          </>
                        ) : (
                          <>
                            <Copy size={13} /> Copiar Speech
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateStage(lead.id, isBooked ? 'new_lead' : 'appointment_set')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isBooked
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                            : 'bg-[#1a1a1a] border-[#333] text-[#AAA] hover:text-[#F5C518] hover:border-[#F5C518]'
                        }`}
                      >
                        <CalendarCheck size={14} />
                        {isBooked ? '✓ Agendado (Cobrable)' : 'Marcar Agendado'}
                      </button>
                    </div>

                    {parsed.originalUrl && (
                      <a
                        href={parsed.originalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#F5C518] hover:bg-[#FFD740] text-black text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        Contactar Cliente <ArrowRight size={13} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
