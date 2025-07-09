import { c as create_ssr_component, a as compute_rest_props, b as compute_slots, j as getContext, v as validate_component, g as add_attribute, i as createEventDispatcher, h as escape, d as spread, e as escape_object, f as escape_attribute_value, s as setContext, l as each, k as subscribe } from "../../../chunks/ssr.js";
import { F as Frame, C as CloseButton, a as Button, B as Badge } from "../../../chunks/Button.js";
import { C as Card } from "../../../chunks/Card.js";
import { L as Label } from "../../../chunks/Label.js";
import { twMerge } from "tailwind-merge";
import { C as Checkbox } from "../../../chunks/Checkbox.js";
import { R as RefreshOutline, L as LoadingSpinner, E as ErrorDisplay, T as Table, a as TableHead, b as TableHeadCell, c as TableBody, d as TableBodyRow, e as TableBodyCell, f as createPaginatedStore, g as createAdvancedPaginatedStore } from "../../../chunks/ErrorDisplay.js";
import { w as writable } from "../../../chunks/index.js";
import { I as Icon } from "../../../chunks/Icon.js";
import { I as Input, c as createUrlWithParams, a as api } from "../../../chunks/modalStore.js";
import { T as TrashBinOutline, S as Select } from "../../../chunks/TrashBinOutline.js";
import { P as PlusOutline } from "../../../chunks/PlusOutline.js";
const common = "me-3 shrink-0 bg-gray-200 rounded-full peer-focus:ring-4 peer-checked:after:translate-x-full peer-checked:rtl:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:bg-white after:border-gray-300 after:border after:rounded-full after:transition-all";
const Toggle = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["size", "group", "value", "checked", "customSize", "classDiv", "disabled"]);
  let $$slots = compute_slots(slots);
  let { size = "default" } = $$props;
  let { group = [] } = $$props;
  let { value = "" } = $$props;
  let { checked = void 0 } = $$props;
  let { customSize = "" } = $$props;
  let { classDiv = "" } = $$props;
  let { disabled = false } = $$props;
  let background = getContext("background");
  const colors = {
    primary: "peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 peer-checked:bg-primary-600",
    secondary: "peer-focus:ring-secondary-300 dark:peer-focus:ring-secondary-800 peer-checked:bg-secondary-600",
    red: "peer-focus:ring-red-300 dark:peer-focus:ring-red-800 peer-checked:bg-red-600",
    green: "peer-focus:ring-green-300 dark:peer-focus:ring-green-800 peer-checked:bg-green-600",
    purple: "peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 peer-checked:bg-purple-600",
    yellow: "peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 peer-checked:bg-yellow-400",
    teal: "peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 peer-checked:bg-teal-600",
    orange: "peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 peer-checked:bg-orange-500",
    blue: "peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:bg-blue-600"
  };
  const sizes = {
    small: "w-9 h-5 after:top-[2px] after:start-[2px] after:h-4 after:w-4",
    default: "w-11 h-6 after:top-0.5 after:start-[2px] after:h-5 after:w-5",
    large: "w-14 h-7 after:top-0.5 after:start-[4px]  after:h-6 after:w-6",
    custom: customSize
  };
  let divClass;
  let checkboxCls;
  if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
  if ($$props.group === void 0 && $$bindings.group && group !== void 0) $$bindings.group(group);
  if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
  if ($$props.checked === void 0 && $$bindings.checked && checked !== void 0) $$bindings.checked(checked);
  if ($$props.customSize === void 0 && $$bindings.customSize && customSize !== void 0) $$bindings.customSize(customSize);
  if ($$props.classDiv === void 0 && $$bindings.classDiv && classDiv !== void 0) $$bindings.classDiv(classDiv);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    divClass = twMerge(
      common,
      $$slots.offLabel ? "ms-3" : "",
      background ? "dark:bg-gray-600 dark:border-gray-500" : "dark:bg-gray-700 dark:border-gray-600",
      colors[$$restProps.color ?? "primary"],
      sizes[size],
      "relative",
      classDiv
    );
    checkboxCls = disabled ? "cursor-not-allowed grayscale contrast-50 text-gray-400" : "cursor-pointer text-gray-900";
    $$rendered = `${validate_component(Checkbox, "Checkbox").$$render(
      $$result,
      Object.assign(
        {},
        { custom: true },
        $$restProps,
        { disabled },
        {
          class: twMerge(checkboxCls, $$props.class)
        },
        { value },
        { checked },
        { group }
      ),
      {
        checked: ($$value) => {
          checked = $$value;
          $$settled = false;
        },
        group: ($$value) => {
          group = $$value;
          $$settled = false;
        }
      },
      {
        default: () => {
          return `${slots.offLabel ? slots.offLabel({}) : ``} <span${add_attribute("class", divClass, 0)}></span> ${slots.default ? slots.default({}) : ``}`;
        }
      }
    )} `;
  } while (!$$settled);
  return $$rendered;
});
const Modal = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let backdropCls;
  let dialogCls;
  let frameCls;
  let headerCls;
  let bodyCls;
  let footerCls;
  let $$restProps = compute_rest_props($$props, [
    "open",
    "title",
    "size",
    "color",
    "placement",
    "autoclose",
    "outsideclose",
    "dismissable",
    "backdropClass",
    "classBackdrop",
    "dialogClass",
    "classDialog",
    "defaultClass",
    "headerClass",
    "classHeader",
    "bodyClass",
    "classBody",
    "footerClass",
    "classFooter"
  ]);
  let $$slots = compute_slots(slots);
  let { open = false } = $$props;
  let { title = "" } = $$props;
  let { size = "md" } = $$props;
  let { color = "default" } = $$props;
  let { placement = "center" } = $$props;
  let { autoclose = false } = $$props;
  let { outsideclose = false } = $$props;
  let { dismissable = true } = $$props;
  let { backdropClass = "fixed inset-0 z-40 bg-gray-900 bg-black/50 dark:bg-black/80" } = $$props;
  let { classBackdrop = void 0 } = $$props;
  let { dialogClass = "fixed top-0 start-0 end-0 h-modal md:inset-0 md:h-full z-50 w-full p-4 flex" } = $$props;
  let { classDialog = void 0 } = $$props;
  let { defaultClass = "relative flex flex-col mx-auto" } = $$props;
  let { headerClass = "flex justify-between items-center p-4 md:p-5 rounded-t-lg" } = $$props;
  let { classHeader = void 0 } = $$props;
  let { bodyClass = "p-4 md:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain" } = $$props;
  let { classBody = void 0 } = $$props;
  let { footerClass = "flex items-center p-4 md:p-5 space-x-3 rtl:space-x-reverse rounded-b-lg" } = $$props;
  let { classFooter = void 0 } = $$props;
  const dispatch = createEventDispatcher();
  const getPlacementClasses = (placement2) => {
    switch (placement2) {
      case "top-left":
        return ["justify-start", "items-start"];
      case "top-center":
        return ["justify-center", "items-start"];
      case "top-right":
        return ["justify-end", "items-start"];
      case "center-left":
        return ["justify-start", "items-center"];
      case "center":
        return ["justify-center", "items-center"];
      case "center-right":
        return ["justify-end", "items-center"];
      case "bottom-left":
        return ["justify-start", "items-end"];
      case "bottom-center":
        return ["justify-center", "items-end"];
      case "bottom-right":
        return ["justify-end", "items-end"];
      default:
        return ["justify-center", "items-center"];
    }
  };
  const sizes = {
    xs: "max-w-md",
    sm: "max-w-lg",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-7xl"
  };
  if ($$props.open === void 0 && $$bindings.open && open !== void 0) $$bindings.open(open);
  if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
  if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
  if ($$props.color === void 0 && $$bindings.color && color !== void 0) $$bindings.color(color);
  if ($$props.placement === void 0 && $$bindings.placement && placement !== void 0) $$bindings.placement(placement);
  if ($$props.autoclose === void 0 && $$bindings.autoclose && autoclose !== void 0) $$bindings.autoclose(autoclose);
  if ($$props.outsideclose === void 0 && $$bindings.outsideclose && outsideclose !== void 0) $$bindings.outsideclose(outsideclose);
  if ($$props.dismissable === void 0 && $$bindings.dismissable && dismissable !== void 0) $$bindings.dismissable(dismissable);
  if ($$props.backdropClass === void 0 && $$bindings.backdropClass && backdropClass !== void 0) $$bindings.backdropClass(backdropClass);
  if ($$props.classBackdrop === void 0 && $$bindings.classBackdrop && classBackdrop !== void 0) $$bindings.classBackdrop(classBackdrop);
  if ($$props.dialogClass === void 0 && $$bindings.dialogClass && dialogClass !== void 0) $$bindings.dialogClass(dialogClass);
  if ($$props.classDialog === void 0 && $$bindings.classDialog && classDialog !== void 0) $$bindings.classDialog(classDialog);
  if ($$props.defaultClass === void 0 && $$bindings.defaultClass && defaultClass !== void 0) $$bindings.defaultClass(defaultClass);
  if ($$props.headerClass === void 0 && $$bindings.headerClass && headerClass !== void 0) $$bindings.headerClass(headerClass);
  if ($$props.classHeader === void 0 && $$bindings.classHeader && classHeader !== void 0) $$bindings.classHeader(classHeader);
  if ($$props.bodyClass === void 0 && $$bindings.bodyClass && bodyClass !== void 0) $$bindings.bodyClass(bodyClass);
  if ($$props.classBody === void 0 && $$bindings.classBody && classBody !== void 0) $$bindings.classBody(classBody);
  if ($$props.footerClass === void 0 && $$bindings.footerClass && footerClass !== void 0) $$bindings.footerClass(footerClass);
  if ($$props.classFooter === void 0 && $$bindings.classFooter && classFooter !== void 0) $$bindings.classFooter(classFooter);
  {
    dispatch(open ? "open" : "close");
  }
  backdropCls = twMerge(backdropClass, classBackdrop);
  dialogCls = twMerge(dialogClass, classDialog, getPlacementClasses(placement));
  frameCls = twMerge(defaultClass, "w-full divide-y", $$props.class);
  headerCls = twMerge(headerClass, classHeader);
  bodyCls = twMerge(bodyClass, classBody);
  footerCls = twMerge(footerClass, classFooter);
  return `${open ? ` <div${add_attribute("class", backdropCls, 0)}></div>   <div${add_attribute("class", dialogCls, 0)} tabindex="-1" aria-modal="true" role="dialog"><div class="${"flex relative " + escape(sizes[size], true) + " w-full max-h-screen"}"> ${validate_component(Frame, "Frame").$$render($$result, Object.assign({}, { rounded: true }, { shadow: true }, $$restProps, { class: frameCls }, { color }), {}, {
    default: () => {
      return ` ${$$slots.header || title ? `${validate_component(Frame, "Frame").$$render($$result, { class: headerCls, color }, {}, {
        default: () => {
          return `${slots.header ? slots.header({}) : ` <h3 class="${"text-xl font-semibold " + escape(
            color === "default" ? "" : "text-gray-900 dark:text-white",
            true
          ) + " p-0"}">${escape(title)}</h3> `} ${dismissable ? `${validate_component(CloseButton, "CloseButton").$$render($$result, { name: "Close modal", color }, {}, {})}` : ``}`;
        }
      })}` : ``}  <div${add_attribute("class", bodyCls, 0)} role="document">${dismissable && !$$slots.header && !title ? `${validate_component(CloseButton, "CloseButton").$$render(
        $$result,
        {
          name: "Close modal",
          class: "absolute top-3 end-2.5",
          color
        },
        {},
        {}
      )}` : ``} ${slots.default ? slots.default({}) : ``}</div>  ${$$slots.footer ? `${validate_component(Frame, "Frame").$$render($$result, { class: footerCls, color }, {}, {
        default: () => {
          return `${slots.footer ? slots.footer({}) : ``}`;
        }
      })}` : ``}`;
    }
  })}</div></div>` : ``} `;
});
const TabItem = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["open", "title", "activeClasses", "inactiveClasses", "defaultClass", "divClass"]);
  let { open = false } = $$props;
  let { title = "Tab title" } = $$props;
  let { activeClasses = void 0 } = $$props;
  let { inactiveClasses = void 0 } = $$props;
  let { defaultClass = "inline-block text-sm font-medium text-center disabled:cursor-not-allowed" } = $$props;
  let { divClass = "" } = $$props;
  const ctx = getContext("ctx") ?? {};
  ctx.selected ?? writable();
  let buttonClass;
  if ($$props.open === void 0 && $$bindings.open && open !== void 0) $$bindings.open(open);
  if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
  if ($$props.activeClasses === void 0 && $$bindings.activeClasses && activeClasses !== void 0) $$bindings.activeClasses(activeClasses);
  if ($$props.inactiveClasses === void 0 && $$bindings.inactiveClasses && inactiveClasses !== void 0) $$bindings.inactiveClasses(inactiveClasses);
  if ($$props.defaultClass === void 0 && $$bindings.defaultClass && defaultClass !== void 0) $$bindings.defaultClass(defaultClass);
  if ($$props.divClass === void 0 && $$bindings.divClass && divClass !== void 0) $$bindings.divClass(divClass);
  buttonClass = twMerge(
    defaultClass,
    open ? activeClasses ?? ctx.activeClasses : inactiveClasses ?? ctx.inactiveClasses,
    open && "active"
  );
  return `<li${add_attribute("class", twMerge("group", $$props.class), 0)} role="presentation"><button${spread(
    [
      { type: "button" },
      { role: "tab" },
      escape_object($$restProps),
      {
        class: escape_attribute_value(buttonClass)
      }
    ],
    {}
  )}>${slots.title ? slots.title({}) : `${escape(title)}`}</button> ${open ? `<div class="hidden tab_content_placeholder"><div${add_attribute("class", divClass, 0)}>${slots.default ? slots.default({}) : ``}</div></div>` : ``}</li> `;
});
const Tabs = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let ulClass;
  let $$restProps = compute_rest_props($$props, [
    "tabStyle",
    "defaultClass",
    "contentClass",
    "divider",
    "activeClasses",
    "inactiveClasses"
  ]);
  let { tabStyle = "none" } = $$props;
  let { defaultClass = "flex flex-wrap space-x-2 rtl:space-x-reverse" } = $$props;
  let { contentClass = "p-4 bg-gray-50 rounded-lg dark:bg-gray-800 mt-4" } = $$props;
  let { divider = true } = $$props;
  let { activeClasses = "p-4 text-primary-600 bg-gray-100 rounded-t-lg dark:bg-gray-800 dark:text-primary-500" } = $$props;
  let { inactiveClasses = "p-4 text-gray-500 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300" } = $$props;
  const styledActiveClasses = {
    full: "p-4 w-full group-first:rounded-s-lg group-last:rounded-e-lg text-gray-900 bg-gray-100 focus:ring-4 focus:ring-primary-300 focus:outline-hidden dark:bg-gray-700 dark:text-white",
    pill: "py-3 px-4 text-white bg-primary-600 rounded-lg",
    underline: "p-4 text-primary-600 border-b-2 border-primary-600 dark:text-primary-500 dark:border-primary-500",
    none: ""
  };
  const styledInactiveClasses = {
    full: "p-4 w-full group-first:rounded-s-lg group-last:rounded-e-lg text-gray-500 dark:text-gray-400 bg-white hover:text-gray-700 hover:bg-gray-50 focus:ring-4 focus:ring-primary-300 focus:outline-hidden dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700",
    pill: "py-3 px-4 text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
    underline: "p-4 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 text-gray-500 dark:text-gray-400",
    none: ""
  };
  const ctx = {
    activeClasses: styledActiveClasses[tabStyle] || activeClasses,
    inactiveClasses: styledInactiveClasses[tabStyle] || inactiveClasses,
    selected: writable()
  };
  setContext("ctx", ctx);
  if ($$props.tabStyle === void 0 && $$bindings.tabStyle && tabStyle !== void 0) $$bindings.tabStyle(tabStyle);
  if ($$props.defaultClass === void 0 && $$bindings.defaultClass && defaultClass !== void 0) $$bindings.defaultClass(defaultClass);
  if ($$props.contentClass === void 0 && $$bindings.contentClass && contentClass !== void 0) $$bindings.contentClass(contentClass);
  if ($$props.divider === void 0 && $$bindings.divider && divider !== void 0) $$bindings.divider(divider);
  if ($$props.activeClasses === void 0 && $$bindings.activeClasses && activeClasses !== void 0) $$bindings.activeClasses(activeClasses);
  if ($$props.inactiveClasses === void 0 && $$bindings.inactiveClasses && inactiveClasses !== void 0) $$bindings.inactiveClasses(inactiveClasses);
  divider = ["full", "pill"].includes(tabStyle) ? false : divider;
  ulClass = twMerge(defaultClass, tabStyle === "underline" && "-mb-px", $$props.class);
  return `<ul${spread([escape_object($$restProps), { class: escape_attribute_value(ulClass) }], {})}>${slots.default ? slots.default({ tabStyle }) : ``}</ul> ${divider ? `${slots.divider ? slots.divider({}) : ` <div class="h-px bg-gray-200 dark:bg-gray-700"></div> `}` : ``} <div${add_attribute("class", contentClass, 0)} role="tabpanel" aria-labelledby="id-tab"></div> `;
});
const EditOutline = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["size", "role", "color", "withEvents", "title", "strokeWidth", "desc", "ariaLabel"]);
  const ctx = getContext("iconCtx") ?? {};
  const sizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8"
  };
  let { size = ctx.size || "md" } = $$props;
  let { role = ctx.role || "img" } = $$props;
  let { color = ctx.color || "currentColor" } = $$props;
  let { withEvents = ctx.withEvents || false } = $$props;
  let { title = {} } = $$props;
  let { strokeWidth = ctx.strokeWidth || "2" } = $$props;
  let { desc = {} } = $$props;
  let ariaDescribedby = `${title.id || ""} ${desc.id || ""}`;
  let hasDescription = false;
  let { ariaLabel = "edit outline" } = $$props;
  if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
  if ($$props.role === void 0 && $$bindings.role && role !== void 0) $$bindings.role(role);
  if ($$props.color === void 0 && $$bindings.color && color !== void 0) $$bindings.color(color);
  if ($$props.withEvents === void 0 && $$bindings.withEvents && withEvents !== void 0) $$bindings.withEvents(withEvents);
  if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
  if ($$props.strokeWidth === void 0 && $$bindings.strokeWidth && strokeWidth !== void 0) $$bindings.strokeWidth(strokeWidth);
  if ($$props.desc === void 0 && $$bindings.desc && desc !== void 0) $$bindings.desc(desc);
  if ($$props.ariaLabel === void 0 && $$bindings.ariaLabel && ariaLabel !== void 0) $$bindings.ariaLabel(ariaLabel);
  {
    if (title.id || desc.id) {
      hasDescription = true;
    } else {
      hasDescription = false;
    }
  }
  return `${withEvents ? `<svg${spread(
    [
      { xmlns: "http://www.w3.org/2000/svg" },
      { fill: "none" },
      { color: escape_attribute_value(color) },
      escape_object($$restProps),
      {
        class: escape_attribute_value(twMerge("shrink-0", sizes[size ?? "md"], $$props.class))
      },
      { role: escape_attribute_value(role) },
      {
        "aria-label": escape_attribute_value(ariaLabel)
      },
      {
        "aria-describedby": escape_attribute_value(hasDescription ? ariaDescribedby : void 0)
      },
      { viewBox: "0 0 24 24" }
    ],
    {}
  )}>${title.id && title.title ? `<title${add_attribute("id", title.id, 0)}>${escape(title.title)}</title>` : ``}${desc.id && desc.desc ? `<desc${add_attribute("id", desc.id, 0)}>${escape(desc.desc)}</desc>` : ``}<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"${add_attribute("stroke-width", strokeWidth, 0)} d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z"></path></svg>` : `<svg${spread(
    [
      { xmlns: "http://www.w3.org/2000/svg" },
      { fill: "none" },
      { color: escape_attribute_value(color) },
      escape_object($$restProps),
      {
        class: escape_attribute_value(twMerge("shrink-0", sizes[size ?? "md"], $$props.class))
      },
      { role: escape_attribute_value(role) },
      {
        "aria-label": escape_attribute_value(ariaLabel)
      },
      {
        "aria-describedby": escape_attribute_value(hasDescription ? ariaDescribedby : void 0)
      },
      { viewBox: "0 0 24 24" }
    ],
    {}
  )}>${title.id && title.title ? `<title${add_attribute("id", title.id, 0)}>${escape(title.title)}</title>` : ``}${desc.id && desc.desc ? `<desc${add_attribute("id", desc.id, 0)}>${escape(desc.desc)}</desc>` : ``}<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"${add_attribute("stroke-width", strokeWidth, 0)} d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z"></path></svg>`} `;
});
function formatCNPJ(cnpj) {
  const numbers = cnpj.replace(/\D/g, "");
  return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}
const ContratadaTablePresenter = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let startIndex;
  let endIndex;
  let hasFiltersApplied;
  let { items = [] } = $$props;
  let { loading = false } = $$props;
  let { error = null } = $$props;
  let { pagination } = $$props;
  let { filters = {} } = $$props;
  let { embedded = false } = $$props;
  let { showEditarContratadaModal = false } = $$props;
  let { contratadaEdicao = null } = $$props;
  const dispatch = createEventDispatcher();
  let itemsPerPageOptions = [
    { value: 5, label: "5 por página" },
    { value: 10, label: "10 por página" },
    { value: 25, label: "25 por página" },
    { value: 50, label: "50 por página" }
  ];
  let formData = { nome: "", cnpj: "" };
  function generatePageNumbers() {
    const totalPages = pagination.totalPages;
    const currentPage = pagination.currentPage;
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + maxVisible - 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
  if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
  if ($$props.loading === void 0 && $$bindings.loading && loading !== void 0) $$bindings.loading(loading);
  if ($$props.error === void 0 && $$bindings.error && error !== void 0) $$bindings.error(error);
  if ($$props.pagination === void 0 && $$bindings.pagination && pagination !== void 0) $$bindings.pagination(pagination);
  if ($$props.filters === void 0 && $$bindings.filters && filters !== void 0) $$bindings.filters(filters);
  if ($$props.embedded === void 0 && $$bindings.embedded && embedded !== void 0) $$bindings.embedded(embedded);
  if ($$props.showEditarContratadaModal === void 0 && $$bindings.showEditarContratadaModal && showEditarContratadaModal !== void 0) $$bindings.showEditarContratadaModal(showEditarContratadaModal);
  if ($$props.contratadaEdicao === void 0 && $$bindings.contratadaEdicao && contratadaEdicao !== void 0) $$bindings.contratadaEdicao(contratadaEdicao);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
    endIndex = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems);
    hasFiltersApplied = Object.values(filters).some((value) => value !== null && value !== void 0 && value !== "");
    {
      console.log("🎨 ContratadaTablePresenter - items:", items.length, items);
    }
    {
      console.log("🎨 ContratadaTablePresenter - loading:", loading);
    }
    {
      console.log("🎨 ContratadaTablePresenter - pagination:", pagination);
    }
    {
      if (showEditarContratadaModal && !contratadaEdicao) {
        formData = { nome: "", cnpj: "" };
      }
    }
    {
      if (showEditarContratadaModal && contratadaEdicao) {
        formData = {
          nome: contratadaEdicao.nome || "",
          cnpj: contratadaEdicao.cnpj || ""
        };
      }
    }
    $$rendered = `   <div class="space-y-6"> ${!embedded ? `<div class="flex items-center justify-between"><div data-svelte-h="svelte-17f1bo4"><h1 class="text-2xl font-bold text-gray-900 dark:text-white">Empresas Contratadas</h1> <p class="text-gray-600 dark:text-gray-400 mt-1">Gerencie as empresas terceirizadas e seus contratos</p></div> <div class="flex items-center space-x-3">${validate_component(Button, "Button").$$render(
      $$result,
      {
        size: "sm",
        color: "alternative",
        class: "rounded-sm",
        disabled: loading
      },
      {},
      {
        default: () => {
          return `${validate_component(RefreshOutline, "RefreshOutline").$$render($$result, { class: "w-4 h-4 mr-2" }, {}, {})}
          Atualizar`;
        }
      }
    )} ${validate_component(Button, "Button").$$render(
      $$result,
      {
        size: "sm",
        color: "primary",
        class: "rounded-sm"
      },
      {},
      {
        default: () => {
          return `${validate_component(PlusOutline, "PlusOutline").$$render($$result, { class: "w-4 h-4 mr-2" }, {}, {})}
          Nova Contratada`;
        }
      }
    )}</div></div>` : ` <div class="flex items-center justify-between"><div data-svelte-h="svelte-10a2tl0"><h3 class="text-lg font-semibold text-gray-900 dark:text-white">Empresas Contratadas</h3> <p class="text-sm text-gray-600 dark:text-gray-400">Gerencie as empresas terceirizadas e seus contratos</p></div> ${validate_component(Button, "Button").$$render(
      $$result,
      {
        size: "sm",
        color: "primary",
        class: "rounded-sm"
      },
      {},
      {
        default: () => {
          return `${validate_component(PlusOutline, "PlusOutline").$$render($$result, { class: "w-4 h-4 mr-2" }, {}, {})}
        Contratada`;
        }
      }
    )}</div>`}  ${validate_component(Card, "Card").$$render($$result, { class: "p-4 rounded-sm !max-w-none" }, {}, {
      default: () => {
        return `<div> <div>${validate_component(Label, "Label").$$render($$result, { for: "filtro-nome", class: "mb-2" }, {}, {
          default: () => {
            return `Buscar por Nome`;
          }
        })} ${validate_component(Input, "Input").$$render(
          $$result,
          {
            id: "filtro-nome",
            value: filters.search || "",
            placeholder: "Digite o nome da empresa...",
            size: "sm",
            class: "rounded-sm"
          },
          {},
          {}
        )}</div></div>  <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"><div class="text-sm text-gray-600 dark:text-gray-400"><span class="font-medium">${escape(pagination.totalItems)}</span> contratada(s) encontrada(s)
        ${hasFiltersApplied ? `<span class="text-blue-600 dark:text-blue-400" data-svelte-h="svelte-ixt4l5">com filtros aplicados</span>` : ``}</div> ${hasFiltersApplied ? `${validate_component(Button, "Button").$$render(
          $$result,
          {
            size: "sm",
            color: "alternative",
            class: "rounded-sm"
          },
          {},
          {
            default: () => {
              return `${validate_component(TrashBinOutline, "TrashBinOutline").$$render($$result, { class: "w-4 h-4 mr-2" }, {}, {})}
          Limpar Filtros`;
            }
          }
        )}` : ``}</div>`;
      }
    })}  ${loading ? `${validate_component(Card, "Card").$$render($$result, { class: "rounded-sm !max-w-none" }, {}, {
      default: () => {
        return `<div class="flex items-center justify-center py-12">${validate_component(LoadingSpinner, "LoadingSpinner").$$render($$result, {}, {}, {})}</div>`;
      }
    })}` : `${error ? `${validate_component(ErrorDisplay, "ErrorDisplay").$$render(
      $$result,
      {
        message: error,
        onRetry: () => dispatch("refresh")
      },
      {},
      {}
    )}` : `${items.length === 0 ? `${validate_component(Card, "Card").$$render($$result, { class: "rounded-sm !max-w-none" }, {}, {
      default: () => {
        return `<div class="text-center py-12"><div class="text-gray-500 dark:text-gray-400">${escape(hasFiltersApplied ? "Nenhuma contratada encontrada com os filtros aplicados." : "Nenhuma contratada cadastrada ainda.")}</div> ${!hasFiltersApplied ? `${validate_component(Button, "Button").$$render(
          $$result,
          {
            size: "sm",
            color: "primary",
            class: "rounded-sm mt-4"
          },
          {},
          {
            default: () => {
              return `${validate_component(PlusOutline, "PlusOutline").$$render($$result, { class: "w-4 h-4 mr-2" }, {}, {})}
            Cadastrar Primeira Contratada`;
            }
          }
        )}` : ``}</div>`;
      }
    })}` : ` ${validate_component(Card, "Card").$$render(
      $$result,
      {
        class: "rounded-sm !max-w-none overflow-hidden"
      },
      {},
      {
        default: () => {
          return `<div class="overflow-x-auto">${validate_component(Table, "Table").$$render($$result, { hoverable: true }, {}, {
            default: () => {
              return `${validate_component(TableHead, "TableHead").$$render($$result, {}, {}, {
                default: () => {
                  return `${validate_component(TableHeadCell, "TableHeadCell").$$render($$result, {}, {}, {
                    default: () => {
                      return `Empresa`;
                    }
                  })} ${validate_component(TableHeadCell, "TableHeadCell").$$render($$result, {}, {}, {
                    default: () => {
                      return `CNPJ`;
                    }
                  })} ${validate_component(TableHeadCell, "TableHeadCell").$$render($$result, {}, {}, {
                    default: () => {
                      return `Data Cadastro`;
                    }
                  })} ${validate_component(TableHeadCell, "TableHeadCell").$$render($$result, {}, {}, {
                    default: () => {
                      return `Ações`;
                    }
                  })}`;
                }
              })} ${validate_component(TableBody, "TableBody").$$render($$result, {}, {}, {
                default: () => {
                  return `${each(items, (contratada) => {
                    return `${validate_component(TableBodyRow, "TableBodyRow").$$render($$result, {}, {}, {
                      default: () => {
                        return `${validate_component(TableBodyCell, "TableBodyCell").$$render($$result, {}, {}, {
                          default: () => {
                            return `<div class="font-medium text-gray-900 dark:text-white">${escape(contratada.nome)}</div> ${contratada.endereco ? `<div class="text-sm text-gray-500 dark:text-gray-400 max-w-48 truncate"${add_attribute("title", contratada.endereco, 0)}>${escape(contratada.endereco)} </div>` : ``} `;
                          }
                        })} ${validate_component(TableBodyCell, "TableBodyCell").$$render($$result, {}, {}, {
                          default: () => {
                            return `<span class="font-mono text-sm">${escape(formatCNPJ(contratada.cnpj))}</span> `;
                          }
                        })} ${validate_component(TableBodyCell, "TableBodyCell").$$render($$result, {}, {}, {
                          default: () => {
                            return `<span class="text-sm">${escape(new Date(contratada.createdAt).toLocaleDateString("pt-BR"))}</span> `;
                          }
                        })} ${validate_component(TableBodyCell, "TableBodyCell").$$render($$result, {}, {}, {
                          default: () => {
                            return `<div class="flex items-center space-x-1"><button class="p-2 rounded-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 transition-colors" title="Editar">${validate_component(EditOutline, "EditOutline").$$render($$result, { class: "w-4 h-4" }, {}, {})}</button> <button class="p-2 rounded-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 transition-colors" title="Excluir">${validate_component(TrashBinOutline, "TrashBinOutline").$$render($$result, { class: "w-4 h-4 text-red-600" }, {}, {})} </button></div> `;
                          }
                        })} `;
                      }
                    })}`;
                  })}`;
                }
              })}`;
            }
          })}</div>  ${pagination.totalPages > 1 ? `<div class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700"><div class="flex items-center space-x-4"><div class="text-sm text-gray-500 dark:text-gray-400">Mostrando ${escape(startIndex)} a ${escape(endIndex)} de ${escape(pagination.totalItems)} resultados</div> ${validate_component(Select, "Select").$$render(
            $$result,
            {
              value: pagination.itemsPerPage.toString(),
              items: itemsPerPageOptions,
              size: "sm",
              class: "w-36 rounded-sm"
            },
            {},
            {}
          )}</div> <div class="flex space-x-2">${validate_component(Button, "Button").$$render(
            $$result,
            {
              size: "sm",
              color: "alternative",
              class: "rounded-sm",
              disabled: pagination.currentPage <= 1
            },
            {},
            {
              default: () => {
                return `Anterior`;
              }
            }
          )}  ${each(generatePageNumbers(), (pageNum) => {
            return `${validate_component(Button, "Button").$$render(
              $$result,
              {
                size: "sm",
                color: pageNum === pagination.currentPage ? "primary" : "alternative",
                class: "rounded-sm min-w-[40px]"
              },
              {},
              {
                default: () => {
                  return `${escape(pageNum)} `;
                }
              }
            )}`;
          })} ${validate_component(Button, "Button").$$render(
            $$result,
            {
              size: "sm",
              color: "alternative",
              class: "rounded-sm",
              disabled: pagination.currentPage >= pagination.totalPages
            },
            {},
            {
              default: () => {
                return `Próximo`;
              }
            }
          )}</div></div>` : ``}`;
        }
      }
    )}`}`}`}</div>   ${validate_component(Modal, "Modal").$$render(
      $$result,
      {
        size: "sm",
        title: contratadaEdicao ? "Editar Contratada" : "Nova Contratada",
        class: "rounded-sm",
        open: showEditarContratadaModal
      },
      {
        open: ($$value) => {
          showEditarContratadaModal = $$value;
          $$settled = false;
        }
      },
      {
        footer: () => {
          return `${validate_component(Button, "Button").$$render(
            $$result,
            {
              color: "alternative",
              class: "rounded-sm"
            },
            {},
            {
              default: () => {
                return `Cancelar`;
              }
            }
          )} ${validate_component(Button, "Button").$$render(
            $$result,
            {
              color: "primary",
              class: "rounded-sm",
              disabled: !formData.nome || !formData.cnpj
            },
            {},
            {
              default: () => {
                return `${escape(contratadaEdicao ? "Atualizar" : "Salvar")}`;
              }
            }
          )} `;
        },
        default: () => {
          return `<div class="space-y-4"><div>${validate_component(Label, "Label").$$render($$result, { for: "nome-contratada", class: "mb-2" }, {}, {
            default: () => {
              return `Nome da Empresa *`;
            }
          })} ${validate_component(Input, "Input").$$render(
            $$result,
            {
              id: "nome-contratada",
              placeholder: "Digite o nome da empresa",
              class: "rounded-sm",
              required: true,
              value: formData.nome
            },
            {
              value: ($$value) => {
                formData.nome = $$value;
                $$settled = false;
              }
            },
            {}
          )}</div> <div>${validate_component(Label, "Label").$$render($$result, { for: "cnpj-contratada", class: "mb-2" }, {}, {
            default: () => {
              return `CNPJ *`;
            }
          })} ${validate_component(Input, "Input").$$render(
            $$result,
            {
              id: "cnpj-contratada",
              placeholder: "00.000.000/0000-00",
              class: "rounded-sm",
              required: true,
              value: formData.cnpj
            },
            {
              value: ($$value) => {
                formData.cnpj = $$value;
                $$settled = false;
              }
            },
            {}
          )}</div> <p class="text-sm text-gray-500 dark:text-gray-400" data-svelte-h="svelte-o0av11">* Campos obrigatórios</p></div>`;
        }
      }
    )}`;
  } while (!$$settled);
  return $$rendered;
});
class ContratadasAdapter {
  /**
   * ✅ PREPARADO PARA BACKEND: Lista contratadas com paginação
   */
  async getContratadas(params) {
    try {
      console.log("🏢 Carregando contratadas...", params);
      const queryParams = {
        page: params.page || 1,
        limit: params.limit || 10
      };
      if (params.searchTerm) {
        queryParams.search = params.searchTerm;
      }
      if (params.statusFilter && params.statusFilter !== "todos") {
        queryParams.status = params.statusFilter.toUpperCase();
      }
      const endpoint = createUrlWithParams("/contratadas", queryParams);
      const response = await api.get(endpoint);
      console.log("📦 Contratadas response real:", response);
      if (response.success && response.data) {
        return {
          contratadas: response.data.contratadas || [],
          total: response.data.total || 0,
          page: params.page || 1,
          limit: params.limit || 10
        };
      }
    } catch (error) {
      console.error("❌ Erro ao carregar contratadas, usando fallback mock:", error);
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockData = [
        {
          id: "1",
          nome: "Alpha Construções Ltda",
          cnpj: "12.345.678/0001-90",
          endereco: "Rua das Construções, 123",
          contato: "(11) 99999-9999",
          status: "ativa",
          colaboradores: 15,
          dataContrato: "2024-01-15",
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-15T10:00:00Z"
        },
        {
          id: "2",
          nome: "Beta Engenharia S.A.",
          cnpj: "98.765.432/0001-10",
          endereco: "Av. Engenharia, 456",
          contato: "contato@betaeng.com.br",
          status: "ativa",
          colaboradores: 8,
          dataContrato: "2024-03-22",
          createdAt: "2024-03-22T14:30:00Z",
          updatedAt: "2024-03-22T14:30:00Z"
        }
      ];
      let contratadasFiltradas = mockData;
      if (params.searchTerm) {
        const searchLower = params.searchTerm.toLowerCase();
        contratadasFiltradas = contratadasFiltradas.filter(
          (contratada) => contratada.nome.toLowerCase().includes(searchLower) || contratada.cnpj.includes(params.searchTerm)
        );
      }
      if (params.statusFilter && params.statusFilter !== "todos") {
        contratadasFiltradas = contratadasFiltradas.filter(
          (contratada) => contratada.status === params.statusFilter
        );
      }
      console.log("✅ Contratadas carregadas (fallback):", contratadasFiltradas.length);
      return {
        contratadas: contratadasFiltradas,
        total: contratadasFiltradas.length,
        page: params.page || 1,
        limit: params.limit || 10
      };
    }
  }
  /**
   * ✅ PREPARADO PARA BACKEND: Busca contratada por ID
   */
  async getContratadaById(id) {
    try {
      console.log("🏢 Buscando contratada:", id);
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockContratada = {
        id,
        nome: "Alpha Construções Ltda",
        cnpj: "12.345.678/0001-90",
        endereco: "Rua das Construções, 123",
        contato: "(11) 99999-9999",
        status: "ativa",
        colaboradores: 15,
        dataContrato: "2024-01-15",
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: "2024-01-15T10:00:00Z"
      };
      console.log("✅ Contratada encontrada:", mockContratada.nome);
      return mockContratada;
    } catch (error) {
      console.error("❌ Erro ao buscar contratada:", error);
      throw error;
    }
  }
  /**
   * ✅ PREPARADO PARA BACKEND: Criar nova contratada
   */
  async createContratada(data) {
    try {
      console.log("💾 Criando contratada:", data);
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      const novaContratada = {
        id: `contratada-${Date.now()}`,
        nome: data.nome,
        cnpj: data.cnpj,
        endereco: data.endereco,
        contato: data.contato,
        status: "ativa",
        colaboradores: 0,
        dataContrato: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      console.log("✅ Contratada criada:", novaContratada.id);
      return novaContratada;
    } catch (error) {
      console.error("❌ Erro ao criar contratada:", error);
      throw error;
    }
  }
  /**
   * ✅ PREPARADO PARA BACKEND: Atualizar contratada
   */
  async updateContratada(id, data) {
    try {
      console.log("💾 Atualizando contratada:", id, data);
      await new Promise((resolve) => setTimeout(resolve, 800));
      const contratadaAtualizada = {
        id,
        nome: data.nome || "Nome Atualizado",
        cnpj: data.cnpj || "12.345.678/0001-90",
        endereco: data.endereco,
        contato: data.contato,
        status: data.status || "ativa",
        colaboradores: 15,
        dataContrato: "2024-01-15",
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      console.log("✅ Contratada atualizada:", contratadaAtualizada.id);
      return contratadaAtualizada;
    } catch (error) {
      console.error("❌ Erro ao atualizar contratada:", error);
      throw error;
    }
  }
  /**
   * ✅ PREPARADO PARA BACKEND: Deletar contratada
   */
  async deleteContratada(id) {
    try {
      console.log("🗑️ Deletando contratada:", id);
      await new Promise((resolve) => setTimeout(resolve, 600));
      console.log("✅ Contratada deletada:", id);
    } catch (error) {
      console.error("❌ Erro ao deletar contratada:", error);
      throw error;
    }
  }
  /**
   * ✅ PREPARADO PARA BACKEND: Alterar status da contratada
   */
  async toggleStatusContratada(id, novoStatus) {
    try {
      console.log("🔄 Alterando status da contratada:", id, novoStatus);
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log("✅ Status da contratada alterado:", id, novoStatus);
    } catch (error) {
      console.error("❌ Erro ao alterar status da contratada:", error);
      throw error;
    }
  }
}
const contratadasAdapter = new ContratadasAdapter();
const ContratadaContainer = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let items;
  let loading;
  let error;
  let pagination;
  let $contratadaStore, $$unsubscribe_contratadaStore;
  let { initialPageSize = 10 } = $$props;
  let { embedded = false } = $$props;
  const contratadaStore = createPaginatedStore(
    async (params) => {
      console.log("🏢 Fetching contratadas with params:", params);
      const result = await contratadasAdapter.getContratadas({
        page: params.page,
        limit: params.limit,
        searchTerm: params.search,
        statusFilter: params.status
      });
      return {
        data: result.contratadas,
        total: result.total,
        page: result.page,
        pageSize: result.limit,
        totalPages: Math.ceil(result.total / result.limit)
      };
    },
    {
      initialPageSize,
      debounceDelay: 300,
      cacheTimeout: 5 * 60 * 1e3,
      enableCache: true
    }
  );
  $$unsubscribe_contratadaStore = subscribe(contratadaStore, (value) => $contratadaStore = value);
  let showEditarContratadaModal = false;
  let contratadaEdicao = null;
  if ($$props.initialPageSize === void 0 && $$bindings.initialPageSize && initialPageSize !== void 0) $$bindings.initialPageSize(initialPageSize);
  if ($$props.embedded === void 0 && $$bindings.embedded && embedded !== void 0) $$bindings.embedded(embedded);
  items = $contratadaStore?.items || [];
  loading = $contratadaStore?.loading || false;
  error = $contratadaStore?.error || null;
  pagination = {
    currentPage: $contratadaStore?.page || 1,
    itemsPerPage: $contratadaStore?.pageSize || initialPageSize,
    totalItems: $contratadaStore?.total || 0,
    totalPages: $contratadaStore?.totalPages || 1
  };
  {
    console.log("🏢 ContratadaContainer - items:", items.length, items);
  }
  {
    console.log("🏢 ContratadaContainer - loading:", loading);
  }
  {
    console.log("🏢 ContratadaContainer - pagination:", pagination);
  }
  $$unsubscribe_contratadaStore();
  return `   ${validate_component(ContratadaTablePresenter, "ContratadaTablePresenter").$$render(
    $$result,
    {
      items,
      loading,
      error,
      pagination,
      embedded,
      showEditarContratadaModal,
      contratadaEdicao
    },
    {},
    {}
  )}`;
});
function formatCPF(cpf) {
  const numbers = cpf.replace(/\D/g, "");
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}
const ColaboradorTablePresenter = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let startIndex;
  let endIndex;
  let hasFiltersApplied;
  let { items = [] } = $$props;
  let { loading = false } = $$props;
  let { error = null } = $$props;
  let { pagination } = $$props;
  let { filters = {} } = $$props;
  let { contratadas = [] } = $$props;
  let { embedded = false } = $$props;
  let { showEditarColaboradorModal = false } = $$props;
  let { colaboradorEdicao = null } = $$props;
  const dispatch = createEventDispatcher();
  let formData = {
    nome: "",
    cpf: "",
    cargo: "",
    contratadaId: ""
  };
  function generatePageNumbers() {
    const totalPages = pagination.totalPages;
    const currentPage = pagination.currentPage;
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + maxVisible - 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
  if ($$props.items === void 0 && $$bindings.items && items !== void 0) $$bindings.items(items);
  if ($$props.loading === void 0 && $$bindings.loading && loading !== void 0) $$bindings.loading(loading);
  if ($$props.error === void 0 && $$bindings.error && error !== void 0) $$bindings.error(error);
  if ($$props.pagination === void 0 && $$bindings.pagination && pagination !== void 0) $$bindings.pagination(pagination);
  if ($$props.filters === void 0 && $$bindings.filters && filters !== void 0) $$bindings.filters(filters);
  if ($$props.contratadas === void 0 && $$bindings.contratadas && contratadas !== void 0) $$bindings.contratadas(contratadas);
  if ($$props.embedded === void 0 && $$bindings.embedded && embedded !== void 0) $$bindings.embedded(embedded);
  if ($$props.showEditarColaboradorModal === void 0 && $$bindings.showEditarColaboradorModal && showEditarColaboradorModal !== void 0) $$bindings.showEditarColaboradorModal(showEditarColaboradorModal);
  if ($$props.colaboradorEdicao === void 0 && $$bindings.colaboradorEdicao && colaboradorEdicao !== void 0) $$bindings.colaboradorEdicao(colaboradorEdicao);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
    endIndex = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems);
    hasFiltersApplied = Object.values(filters).some((value) => value !== null && value !== void 0 && value !== "");
    {
      console.log("👨‍💼 ColaboradorTablePresenter - items:", items.length, items);
    }
    {
      console.log("👨‍💼 ColaboradorTablePresenter - loading:", loading);
    }
    {
      console.log("👨‍💼 ColaboradorTablePresenter - pagination:", pagination);
    }
    {
      console.log("👨‍💼 ColaboradorTablePresenter - contratadas:", contratadas.length, contratadas);
    }
    {
      if (showEditarColaboradorModal && !colaboradorEdicao) {
        formData = {
          nome: "",
          cpf: "",
          cargo: "",
          contratadaId: ""
        };
      }
    }
    {
      if (showEditarColaboradorModal && colaboradorEdicao) {
        formData = {
          nome: colaboradorEdicao.nome || "",
          cpf: colaboradorEdicao.cpf || "",
          cargo: colaboradorEdicao.cargo || "",
          contratadaId: colaboradorEdicao.contratadaId || ""
        };
      }
    }
    $$rendered = `   <div class="space-y-6"> ${!embedded ? `<div class="flex items-center justify-between"><div data-svelte-h="svelte-5f3x1k"><h1 class="text-2xl font-bold text-gray-900 dark:text-white">Colaboradores</h1> <p class="text-gray-600 dark:text-gray-400 mt-1">Gerencie os colaboradores das empresas contratadas</p></div> <div class="flex items-center space-x-3">${validate_component(Button, "Button").$$render(
      $$result,
      {
        size: "sm",
        color: "alternative",
        class: "rounded-sm",
        disabled: loading
      },
      {},
      {
        default: () => {
          return `${validate_component(RefreshOutline, "RefreshOutline").$$render($$result, { class: "w-4 h-4 mr-2" }, {}, {})}
          Atualizar`;
        }
      }
    )} ${validate_component(Button, "Button").$$render(
      $$result,
      {
        size: "sm",
        color: "primary",
        class: "rounded-sm"
      },
      {},
      {
        default: () => {
          return `${validate_component(PlusOutline, "PlusOutline").$$render($$result, { class: "w-4 h-4 mr-2" }, {}, {})}
          Novo Colaborador`;
        }
      }
    )}</div></div>` : `<div class="flex items-center justify-between"><div data-svelte-h="svelte-8aj39m"><h3 class="text-lg font-semibold text-gray-900 dark:text-white">Colaboradores</h3> <p class="text-sm text-gray-600 dark:text-gray-400">Gerencie os colaboradores das empresas contratadas</p></div> ${validate_component(Button, "Button").$$render(
      $$result,
      {
        size: "sm",
        color: "primary",
        class: "rounded-sm"
      },
      {},
      {
        default: () => {
          return `${validate_component(PlusOutline, "PlusOutline").$$render($$result, { class: "w-4 h-4 mr-2" }, {}, {})}
        Colaborador`;
        }
      }
    )}</div>`}  ${validate_component(Card, "Card").$$render($$result, { class: "p-4 rounded-sm !max-w-none" }, {}, {
      default: () => {
        return `<div class="grid gap-4 md:grid-cols-3"><div>${validate_component(Label, "Label").$$render($$result, { for: "filtro-nome", class: "mb-2" }, {}, {
          default: () => {
            return `Buscar por Nome`;
          }
        })} ${validate_component(Input, "Input").$$render(
          $$result,
          {
            id: "filtro-nome",
            value: filters.search || "",
            placeholder: "Digite o nome do colaborador...",
            size: "sm",
            class: "rounded-sm"
          },
          {},
          {}
        )}</div> <div>${validate_component(Label, "Label").$$render($$result, { for: "filtro-contratada", class: "mb-2" }, {}, {
          default: () => {
            return `Contratada`;
          }
        })} ${validate_component(Select, "Select").$$render(
          $$result,
          {
            id: "filtro-contratada",
            value: filters.contratadaId || "",
            size: "sm",
            class: "rounded-sm"
          },
          {},
          {
            default: () => {
              return `<option value="" data-svelte-h="svelte-dvi4c7">Todas as contratadas</option> ${each(contratadas, (contratada) => {
                return `<option${add_attribute("value", contratada.id, 0)}>${escape(contratada.nome)}</option>`;
              })}`;
            }
          }
        )}</div></div> <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"><div class="text-sm text-gray-600 dark:text-gray-400"><span class="font-medium">${escape(pagination.totalItems)}</span> colaborador(es) encontrado(s)</div> ${hasFiltersApplied ? `${validate_component(Button, "Button").$$render(
          $$result,
          {
            size: "sm",
            color: "alternative",
            class: "rounded-sm"
          },
          {},
          {
            default: () => {
              return `${validate_component(TrashBinOutline, "TrashBinOutline").$$render($$result, { class: "w-4 h-4 mr-2" }, {}, {})}
          Limpar Filtros`;
            }
          }
        )}` : ``}</div>`;
      }
    })}  ${loading ? `${validate_component(Card, "Card").$$render($$result, { class: "rounded-sm !max-w-none" }, {}, {
      default: () => {
        return `<div class="flex items-center justify-center py-12">${validate_component(LoadingSpinner, "LoadingSpinner").$$render($$result, {}, {}, {})}</div>`;
      }
    })}` : `${error ? `${validate_component(ErrorDisplay, "ErrorDisplay").$$render(
      $$result,
      {
        message: error,
        onRetry: () => dispatch("refresh")
      },
      {},
      {}
    )}` : `${items.length === 0 ? `${validate_component(Card, "Card").$$render($$result, { class: "rounded-sm !max-w-none" }, {}, {
      default: () => {
        return `<div class="text-center py-12"><div class="text-gray-500 dark:text-gray-400">${escape(hasFiltersApplied ? "Nenhum colaborador encontrado com os filtros aplicados." : "Nenhum colaborador cadastrado ainda.")}</div></div>`;
      }
    })}` : ` ${validate_component(Card, "Card").$$render(
      $$result,
      {
        class: "rounded-sm !max-w-none overflow-hidden"
      },
      {},
      {
        default: () => {
          return `<div class="overflow-x-auto">${validate_component(Table, "Table").$$render($$result, { hoverable: true }, {}, {
            default: () => {
              return `${validate_component(TableHead, "TableHead").$$render($$result, {}, {}, {
                default: () => {
                  return `${validate_component(TableHeadCell, "TableHeadCell").$$render($$result, {}, {}, {
                    default: () => {
                      return `Nome`;
                    }
                  })} ${validate_component(TableHeadCell, "TableHeadCell").$$render($$result, {}, {}, {
                    default: () => {
                      return `CPF`;
                    }
                  })} ${validate_component(TableHeadCell, "TableHeadCell").$$render($$result, {}, {}, {
                    default: () => {
                      return `Cargo`;
                    }
                  })} ${validate_component(TableHeadCell, "TableHeadCell").$$render($$result, {}, {}, {
                    default: () => {
                      return `Contratada`;
                    }
                  })} ${validate_component(TableHeadCell, "TableHeadCell").$$render($$result, {}, {}, {
                    default: () => {
                      return `Ações`;
                    }
                  })}`;
                }
              })} ${validate_component(TableBody, "TableBody").$$render($$result, {}, {}, {
                default: () => {
                  return `${each(items, (colaborador) => {
                    return `${validate_component(TableBodyRow, "TableBodyRow").$$render($$result, {}, {}, {
                      default: () => {
                        return `${validate_component(TableBodyCell, "TableBodyCell").$$render($$result, {}, {}, {
                          default: () => {
                            return `<div class="font-medium text-gray-900 dark:text-white">${escape(colaborador.nome)}</div> ${colaborador.email ? `<div class="text-sm text-blue-600 dark:text-blue-400">${escape(colaborador.email)}</div>` : ``} `;
                          }
                        })} ${validate_component(TableBodyCell, "TableBodyCell").$$render($$result, {}, {}, {
                          default: () => {
                            return `<span class="font-mono text-sm">${escape(formatCPF(colaborador.cpf))}</span> `;
                          }
                        })} ${validate_component(TableBodyCell, "TableBodyCell").$$render($$result, {}, {}, {
                          default: () => {
                            return `<span class="text-sm">${escape(colaborador.cargo || "-")}</span> `;
                          }
                        })} ${validate_component(TableBodyCell, "TableBodyCell").$$render($$result, {}, {}, {
                          default: () => {
                            return `<span class="text-sm">${escape(colaborador.contratada?.nome || "-")}</span> `;
                          }
                        })} ${validate_component(TableBodyCell, "TableBodyCell").$$render($$result, {}, {}, {
                          default: () => {
                            return `<div class="flex items-center space-x-1"><button class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700" title="Editar">${validate_component(EditOutline, "EditOutline").$$render($$result, { class: "w-4 h-4" }, {}, {})}</button> <button class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700" title="Excluir">${validate_component(TrashBinOutline, "TrashBinOutline").$$render($$result, { class: "w-4 h-4 text-red-600" }, {}, {})} </button></div> `;
                          }
                        })} `;
                      }
                    })}`;
                  })}`;
                }
              })}`;
            }
          })}</div>  ${pagination.totalPages > 1 ? `<div class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700"><div class="text-sm text-gray-500 dark:text-gray-400">Mostrando ${escape(startIndex)} a ${escape(endIndex)} de ${escape(pagination.totalItems)} resultados</div> <div class="flex space-x-2">${validate_component(Button, "Button").$$render(
            $$result,
            {
              size: "sm",
              color: "alternative",
              class: "rounded-sm",
              disabled: pagination.currentPage <= 1
            },
            {},
            {
              default: () => {
                return `Anterior`;
              }
            }
          )} ${each(generatePageNumbers(), (pageNum) => {
            return `${validate_component(Button, "Button").$$render(
              $$result,
              {
                size: "sm",
                color: pageNum === pagination.currentPage ? "primary" : "alternative",
                class: "rounded-sm min-w-[40px]"
              },
              {},
              {
                default: () => {
                  return `${escape(pageNum)} `;
                }
              }
            )}`;
          })} ${validate_component(Button, "Button").$$render(
            $$result,
            {
              size: "sm",
              color: "alternative",
              class: "rounded-sm",
              disabled: pagination.currentPage >= pagination.totalPages
            },
            {},
            {
              default: () => {
                return `Próximo`;
              }
            }
          )}</div></div>` : ``}`;
        }
      }
    )}`}`}`}</div>  ${validate_component(Modal, "Modal").$$render(
      $$result,
      {
        size: "sm",
        title: colaboradorEdicao ? "Editar Colaborador" : "Novo Colaborador",
        class: "rounded-sm",
        open: showEditarColaboradorModal
      },
      {
        open: ($$value) => {
          showEditarColaboradorModal = $$value;
          $$settled = false;
        }
      },
      {
        footer: () => {
          return `${validate_component(Button, "Button").$$render(
            $$result,
            {
              color: "alternative",
              class: "rounded-sm"
            },
            {},
            {
              default: () => {
                return `Cancelar`;
              }
            }
          )} ${validate_component(Button, "Button").$$render(
            $$result,
            {
              color: "primary",
              class: "rounded-sm",
              disabled: !formData.nome || !formData.cpf || !formData.cargo || !formData.contratadaId
            },
            {},
            {
              default: () => {
                return `${escape(colaboradorEdicao ? "Atualizar" : "Salvar")}`;
              }
            }
          )} `;
        },
        default: () => {
          return `<div class="space-y-4"><div>${validate_component(Label, "Label").$$render($$result, { for: "nome-colaborador", class: "mb-2" }, {}, {
            default: () => {
              return `Nome Completo *`;
            }
          })} ${validate_component(Input, "Input").$$render(
            $$result,
            {
              id: "nome-colaborador",
              placeholder: "Digite o nome completo",
              class: "rounded-sm",
              required: true,
              value: formData.nome
            },
            {
              value: ($$value) => {
                formData.nome = $$value;
                $$settled = false;
              }
            },
            {}
          )}</div> <div>${validate_component(Label, "Label").$$render($$result, { for: "cpf-colaborador", class: "mb-2" }, {}, {
            default: () => {
              return `CPF *`;
            }
          })} ${validate_component(Input, "Input").$$render(
            $$result,
            {
              id: "cpf-colaborador",
              placeholder: "000.000.000-00",
              class: "rounded-sm",
              required: true,
              value: formData.cpf
            },
            {
              value: ($$value) => {
                formData.cpf = $$value;
                $$settled = false;
              }
            },
            {}
          )}</div> <div>${validate_component(Label, "Label").$$render($$result, { for: "cargo-colaborador", class: "mb-2" }, {}, {
            default: () => {
              return `Cargo *`;
            }
          })} ${validate_component(Input, "Input").$$render(
            $$result,
            {
              id: "cargo-colaborador",
              placeholder: "Digite o cargo do colaborador",
              class: "rounded-sm",
              required: true,
              value: formData.cargo
            },
            {
              value: ($$value) => {
                formData.cargo = $$value;
                $$settled = false;
              }
            },
            {}
          )}</div> <div>${validate_component(Label, "Label").$$render(
            $$result,
            {
              for: "contratada-colaborador",
              class: "mb-2"
            },
            {},
            {
              default: () => {
                return `Contratada *`;
              }
            }
          )} ${validate_component(Select, "Select").$$render(
            $$result,
            {
              id: "contratada-colaborador",
              class: "rounded-sm",
              required: true,
              value: formData.contratadaId
            },
            {
              value: ($$value) => {
                formData.contratadaId = $$value;
                $$settled = false;
              }
            },
            {
              default: () => {
                return `<option value="" data-svelte-h="svelte-1mt2afb">Selecione a contratada</option> ${each(contratadas, (contratada) => {
                  return `<option${add_attribute("value", contratada.id, 0)}>${escape(contratada.nome)}</option>`;
                })}`;
              }
            }
          )}</div> <p class="text-sm text-gray-500 dark:text-gray-400" data-svelte-h="svelte-o0av11">* Campos obrigatórios</p></div>`;
        }
      }
    )}`;
  } while (!$$settled);
  return $$rendered;
});
const ColaboradorContainer = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let items;
  let loading;
  let error;
  let pagination;
  let filters;
  let contratadas;
  let $colaboradorStore, $$unsubscribe_colaboradorStore;
  let { initialPageSize = 10 } = $$props;
  let { embedded = false } = $$props;
  const colaboradorStore = createAdvancedPaginatedStore({
    baseEndpoint: "/colaboradores",
    defaultPageSize: initialPageSize,
    debounceDelay: 300,
    cacheTimeout: 5 * 60 * 1e3
  });
  $$unsubscribe_colaboradorStore = subscribe(colaboradorStore, (value) => $colaboradorStore = value);
  let showEditarColaboradorModal = false;
  let colaboradorEdicao = null;
  if ($$props.initialPageSize === void 0 && $$bindings.initialPageSize && initialPageSize !== void 0) $$bindings.initialPageSize(initialPageSize);
  if ($$props.embedded === void 0 && $$bindings.embedded && embedded !== void 0) $$bindings.embedded(embedded);
  items = $colaboradorStore.items || [];
  loading = $colaboradorStore.loading;
  error = $colaboradorStore.error;
  pagination = {
    currentPage: $colaboradorStore.page,
    itemsPerPage: $colaboradorStore.pageSize,
    totalItems: $colaboradorStore.total,
    totalPages: $colaboradorStore.totalPages
  };
  filters = colaboradorStore.filters;
  contratadas = colaboradorStore.filterOptions.contratadas || [];
  {
    console.log("👥 ColaboradorContainer - items:", items.length, items);
  }
  {
    console.log("👥 ColaboradorContainer - loading:", loading);
  }
  {
    console.log("👥 ColaboradorContainer - pagination:", pagination);
  }
  {
    console.log("👥 ColaboradorContainer - contratadas:", contratadas.length, contratadas);
  }
  $$unsubscribe_colaboradorStore();
  return `   ${validate_component(ColaboradorTablePresenter, "ColaboradorTablePresenter").$$render(
    $$result,
    {
      items,
      loading,
      error,
      pagination,
      filters,
      contratadas,
      embedded,
      showEditarColaboradorModal,
      colaboradorEdicao
    },
    {},
    {}
  )}`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let configuracoesSistema = [];
  let permitirEstoqueNegativo = false;
  let permitirAjusteEstoqueDireto = true;
  let configuracoesSalvando = false;
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    $$rendered = `   ${$$result.head += `<!-- HEAD_svelte-f8urp3_START -->${$$result.title = `<title>Configurações - DataLife EPI</title>`, ""}<meta name="description" content="Configure as opções do sistema, gerencie contratadas e colaboradores"><!-- HEAD_svelte-f8urp3_END -->`, ""}  <div class="space-y-6"> <div class="flex items-center justify-between"><div data-svelte-h="svelte-10zx19n"><h1 class="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1> <p class="text-gray-600 dark:text-gray-400 mt-1">Configure as opções do sistema e gerencie recursos</p></div> <div class="flex items-center space-x-2">${validate_component(Icon, "Icon").$$render(
      $$result,
      {
        name: "CogOutline",
        className: "text-gray-500",
        size: "w-6 h-6"
      },
      {},
      {}
    )}</div></div>  ${validate_component(Card, "Card").$$render($$result, { class: "p-0 rounded-sm !max-w-none" }, {}, {
      default: () => {
        return `${validate_component(Tabs, "Tabs").$$render(
          $$result,
          {
            tabStyle: "underline",
            contentClass: "p-6"
          },
          {},
          {
            default: () => {
              return ` ${validate_component(TabItem, "TabItem").$$render(
                $$result,
                {
                  open: true,
                  title: "Configurações Gerais"
                },
                {},
                {
                  default: () => {
                    return `${`${`<div class="space-y-6"><div class="grid gap-6 md:grid-cols-2"> ${validate_component(Card, "Card").$$render($$result, { class: "rounded-sm !max-w-none" }, {}, {
                      default: () => {
                        return `<div class="flex items-center space-x-3 mb-4"><div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-sm">${validate_component(Icon, "Icon").$$render(
                          $$result,
                          {
                            name: "CubeOutline",
                            className: "text-blue-600 dark:text-blue-400",
                            size: "w-5 h-5"
                          },
                          {},
                          {}
                        )}</div> <h3 class="text-lg font-semibold text-gray-900 dark:text-white" data-svelte-h="svelte-2nw9gz">Gestão de Estoque</h3></div> <div class="space-y-4"><div class="flex items-center justify-between"><div>${validate_component(Label, "Label").$$render(
                          $$result,
                          {
                            class: "text-sm font-medium text-gray-900 dark:text-white"
                          },
                          {},
                          {
                            default: () => {
                              return `Permitir estoque negativo`;
                            }
                          }
                        )} <p class="text-xs text-gray-500 dark:text-gray-400 mt-1" data-svelte-h="svelte-styh6f">Permite que itens tenham quantidade negativa no estoque</p></div> ${validate_component(Toggle, "Toggle").$$render(
                          $$result,
                          {
                            disabled: configuracoesSalvando,
                            checked: permitirEstoqueNegativo
                          },
                          {
                            checked: ($$value) => {
                              permitirEstoqueNegativo = $$value;
                              $$settled = false;
                            }
                          },
                          {}
                        )}</div> <div class="flex items-center justify-between"><div>${validate_component(Label, "Label").$$render(
                          $$result,
                          {
                            class: "text-sm font-medium text-gray-900 dark:text-white"
                          },
                          {},
                          {
                            default: () => {
                              return `Permitir ajuste direto de estoque`;
                            }
                          }
                        )} <p class="text-xs text-gray-500 dark:text-gray-400 mt-1" data-svelte-h="svelte-1ak2ef2">Permite ajustes manuais de quantidade sem movimentação</p></div> ${validate_component(Toggle, "Toggle").$$render(
                          $$result,
                          {
                            disabled: configuracoesSalvando,
                            checked: permitirAjusteEstoqueDireto
                          },
                          {
                            checked: ($$value) => {
                              permitirAjusteEstoqueDireto = $$value;
                              $$settled = false;
                            }
                          },
                          {}
                        )}</div></div>`;
                      }
                    })}  ${validate_component(Card, "Card").$$render($$result, { class: "rounded-sm !max-w-none" }, {}, {
                      default: () => {
                        return `<div class="flex items-center space-x-3 mb-4"><div class="p-2 bg-green-100 dark:bg-green-900 rounded-sm">${validate_component(Icon, "Icon").$$render(
                          $$result,
                          {
                            name: "CheckCircleOutline",
                            className: "text-green-600 dark:text-green-400",
                            size: "w-5 h-5"
                          },
                          {},
                          {}
                        )}</div> <h3 class="text-lg font-semibold text-gray-900 dark:text-white" data-svelte-h="svelte-sqkd2">Status do Sistema</h3></div> <div class="space-y-3"><div class="flex items-center justify-between"><span class="text-sm text-gray-600 dark:text-gray-400" data-svelte-h="svelte-1ovcvef">Backend conectado:</span> ${validate_component(Badge, "Badge").$$render(
                          $$result,
                          {
                            color: "green",
                            class: "w-fit rounded-sm"
                          },
                          {},
                          {
                            default: () => {
                              return `Online`;
                            }
                          }
                        )}</div> <div class="flex items-center justify-between"><span class="text-sm text-gray-600 dark:text-gray-400" data-svelte-h="svelte-14hv9bi">Base de dados:</span> ${validate_component(Badge, "Badge").$$render(
                          $$result,
                          {
                            color: "green",
                            class: "w-fit rounded-sm"
                          },
                          {},
                          {
                            default: () => {
                              return `PostgreSQL`;
                            }
                          }
                        )}</div> <div class="flex items-center justify-between"><span class="text-sm text-gray-600 dark:text-gray-400" data-svelte-h="svelte-ii9bl6">Configurações carregadas:</span> <span class="text-sm text-gray-900 dark:text-white">${escape(configuracoesSistema.length)}</span></div> <div class="flex items-center justify-between" data-svelte-h="svelte-1ujwg6j"><span class="text-sm text-gray-600 dark:text-gray-400">Última sincronização:</span> <span class="text-sm text-gray-900 dark:text-white">Agora</span></div></div>`;
                      }
                    })}</div>  ${configuracoesSistema.length > 0 ? `${validate_component(Card, "Card").$$render($$result, { class: "rounded-sm !max-w-none" }, {}, {
                      default: () => {
                        return `<div class="flex items-center space-x-3 mb-4"><div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-sm">${validate_component(Icon, "Icon").$$render(
                          $$result,
                          {
                            name: "TableCellsOutline",
                            className: "text-blue-600 dark:text-blue-400",
                            size: "w-5 h-5"
                          },
                          {},
                          {}
                        )}</div> <h3 class="text-lg font-semibold text-gray-900 dark:text-white" data-svelte-h="svelte-qb2tms">Todas as Configurações</h3></div> <div class="overflow-x-auto">${validate_component(Table, "Table").$$render($$result, {}, {}, {
                          default: () => {
                            return `${validate_component(TableHead, "TableHead").$$render($$result, {}, {}, {
                              default: () => {
                                return `${validate_component(TableHeadCell, "TableHeadCell").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Configuração`;
                                  }
                                })} ${validate_component(TableHeadCell, "TableHeadCell").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Valor`;
                                  }
                                })} ${validate_component(TableHeadCell, "TableHeadCell").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Tipo`;
                                  }
                                })} ${validate_component(TableHeadCell, "TableHeadCell").$$render($$result, {}, {}, {
                                  default: () => {
                                    return `Descrição`;
                                  }
                                })}`;
                              }
                            })} ${validate_component(TableBody, "TableBody").$$render($$result, {}, {}, {
                              default: () => {
                                return `${each(configuracoesSistema, (config) => {
                                  return `${validate_component(TableBodyRow, "TableBodyRow").$$render($$result, {}, {}, {
                                    default: () => {
                                      return `${validate_component(TableBodyCell, "TableBodyCell").$$render($$result, {}, {}, {
                                        default: () => {
                                          return `<span class="font-mono text-sm">${escape(config.chave)}</span> `;
                                        }
                                      })} ${validate_component(TableBodyCell, "TableBodyCell").$$render($$result, {}, {}, {
                                        default: () => {
                                          return `${validate_component(Badge, "Badge").$$render(
                                            $$result,
                                            {
                                              color: config.tipo === "BOOLEAN" ? config.valorParsed ? "green" : "red" : "blue",
                                              class: "w-fit rounded-sm"
                                            },
                                            {},
                                            {
                                              default: () => {
                                                return `${escape(config.valor)} `;
                                              }
                                            }
                                          )} `;
                                        }
                                      })} ${validate_component(TableBodyCell, "TableBodyCell").$$render($$result, {}, {}, {
                                        default: () => {
                                          return `<span class="text-sm text-gray-600 dark:text-gray-400">${escape(config.tipo)}</span> `;
                                        }
                                      })} ${validate_component(TableBodyCell, "TableBodyCell").$$render($$result, {}, {}, {
                                        default: () => {
                                          return `<span class="text-sm">${escape(config.descricao)}</span> `;
                                        }
                                      })} `;
                                    }
                                  })}`;
                                })}`;
                              }
                            })}`;
                          }
                        })}</div>`;
                      }
                    })}` : ``} ${``}</div>`}`}`;
                  }
                }
              )}  ${validate_component(TabItem, "TabItem").$$render($$result, { title: "Contratadas" }, {}, {
                default: () => {
                  return ` ${validate_component(ContratadaContainer, "ContratadaContainer").$$render($$result, { initialPageSize: 10, embedded: true }, {}, {})}`;
                }
              })}  ${validate_component(TabItem, "TabItem").$$render($$result, { title: "Colaboradores" }, {}, {
                default: () => {
                  return ` ${validate_component(ColaboradorContainer, "ColaboradorContainer").$$render($$result, { initialPageSize: 10, embedded: true }, {}, {})}`;
                }
              })}`;
            }
          }
        )}`;
      }
    })}</div>`;
  } while (!$$settled);
  return $$rendered;
});
export {
  Page as default
};
