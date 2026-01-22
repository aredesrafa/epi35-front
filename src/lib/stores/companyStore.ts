import { writable } from "svelte/store";

export interface Company {
  id: string;
  name: string;
  badge: string;
  badgeColor: "green" | "blue" | "yellow" | "red" | "purple" | "indigo";
}

export const companies: Company[] = [
  {
    id: "datalife",
    name: "Data Life",
    badge: "Admin",
    badgeColor: "green",
  },
  {
    id: "holding-fbit",
    name: "Holding Fbit",
    badge: "Holding",
    badgeColor: "blue",
  },
  {
    id: "grupo-energia",
    name: "Grupo Energia Nacional",
    badge: "Holding",
    badgeColor: "blue",
  },
  {
    id: "corporacao-alpha",
    name: "Corporação Alpha Holdings",
    badge: "Holding",
    badgeColor: "blue",
  },
  {
    id: "empresa-sa",
    name: "Empresa S.A.",
    badge: "Contratada",
    badgeColor: "yellow",
  },
  {
    id: "construtech-ltda",
    name: "ConstruTech Ltda",
    badge: "Contratada",
    badgeColor: "yellow",
  },
  {
    id: "industrias-brasil",
    name: "Indústrias Brasil Metalúrgica",
    badge: "Contratada",
    badgeColor: "yellow",
  },
  {
    id: "mineracao-vale",
    name: "Mineração Vale do Ouro",
    badge: "Contratada",
    badgeColor: "yellow",
  },
  {
    id: "petro-servicos",
    name: "Petro Serviços e Manutenção",
    badge: "Contratada",
    badgeColor: "yellow",
  },
  {
    id: "solucoes-industriais",
    name: "Soluções Industriais do Nordeste",
    badge: "Contratada",
    badgeColor: "yellow",
  },
];

// Store para empresa selecionada
export const selectedCompanyStore = writable<Company>(companies[0]);
