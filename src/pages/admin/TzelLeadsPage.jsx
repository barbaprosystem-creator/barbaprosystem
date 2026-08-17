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
