const menu = document.querySelector(".menu");
const navigation = document.querySelector("#navigation");
const mobile = matchMedia("(max-width: 49rem)");
const courseList = document.querySelector("#course-list");
const footerCourses = document.querySelector("#footer-courses");
const dialog = document.querySelector("#course-dialog");
const dialogTitle = document.querySelector("#dialog-title");
const dialogBody = document.querySelector("#dialog-body");
const form = document.querySelector("#application");
const courseSelect = document.querySelector("#course");
const formError = document.querySelector("#form-error");
const formSuccess = document.querySelector("#form-success");
let activeCourse;
let dialogTrigger;

function setMenu(open) {
  menu.setAttribute("aria-expanded", String(open));
  navigation.hidden = mobile.matches && !open;
}

document.documentElement.classList.add("js");
setMenu(false);
mobile.addEventListener("change", () => {
  const focused = document.activeElement;
  setMenu(false);
  if (mobile.matches && navigation.contains(focused)) menu.focus();
  if (!mobile.matches && focused === menu) navigation.querySelector("a").focus();
});
menu.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") === "false"));
document.querySelector(".header").addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    menu.focus();
  }
});
navigation.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link || !mobile.matches) return;
  const target = document.querySelector(link.hash);
  target.tabIndex = -1;
  target.focus({ preventScroll: true });
  setMenu(false);
});

function element(tag, value, className) {
  const node = document.createElement(tag);
  if (value) node.textContent = value;
  if (className) node.className = className;
  return node;
}

function courseMeta(course) {
  const list = element("dl", "", "dialog-meta");
  const rows = [
    ["Уровень", course.level],
    ["Срок", course.duration],
    ["Формат", course.format],
    ["Преподаватель", "Уточняется · " + course.teacher]
  ];
  for (const [label, value] of rows) list.append(element("dt", label), element("dd", value));
  return list;
}

function addDetails(heading, content) {
  dialogBody.append(element("h3", heading));
  if (Array.isArray(content)) {
    const list = element("ul");
    for (const item of content) list.append(element("li", item));
    dialogBody.append(list);
  } else {
    dialogBody.append(element("p", content));
  }
}

function openCourse(course, trigger) {
  activeCourse = course;
  dialogTrigger = trigger;
  dialogTitle.textContent = course.title;
  dialogBody.replaceChildren();
  addDetails("О курсе", course.description);
  dialogBody.append(courseMeta(course));
  addDetails("Для кого", course.audience);
  addDetails("Чему научитесь", course.outcomes);
  addDetails("Программа", course.modules);
  addDetails("Практика", course.project);
  dialog.showModal();
  dialogTitle.focus();
  dialog.scrollTop = 0;
}

function selectCourse(course) {
  courseSelect.value = course.id;
  formSuccess.textContent = "";
  clearFieldError(courseSelect);
  if (!form.querySelector("[aria-invalid]")) formError.textContent = "";
  location.hash = "apply";
  document.querySelector("#apply-heading").focus();
}

dialog.addEventListener("close", () => {
  dialogTrigger?.focus();
  dialogTrigger = null;
});
document.querySelector("#dialog-apply").addEventListener("click", () => {
  dialogTrigger = null;
  dialog.close();
  selectCourse(activeCourse);
});

for (const course of courses) {
  const card = element("li", "", "card");
  const actions = element("div", "", "actions");
  const details = element("button", "Подробнее", "button outline");
  const apply = element("button", "Записаться", "button");
  details.type = apply.type = "button";
  details.setAttribute("aria-label", "Подробнее о курсе «" + course.title + "»");
  details.setAttribute("aria-haspopup", "dialog");
  apply.setAttribute("aria-label", "Записаться на курс «" + course.title + "»");
  details.addEventListener("click", () => openCourse(course, details));
  apply.addEventListener("click", () => selectCourse(course));
  actions.append(details, apply);
  card.append(element("p", course.category, "category"), element("h3", course.title),
    element("p", course.description), courseMeta(course), element("p", "Навыки: " + course.skills), actions);
  courseList.append(card);

  const option = element("option", course.title);
  option.value = course.id;
  courseSelect.append(option);

  const footerItem = element("li");
  const footerButton = element("button", course.category, "footer-link");
  footerButton.type = "button";
  footerButton.setAttribute("aria-haspopup", "dialog");
  footerButton.addEventListener("click", () => openCourse(course, footerButton));
  footerItem.append(footerButton);
  footerCourses.append(footerItem);
}

const nameInput = form.elements.namedItem("name");
const phoneInput = form.elements.namedItem("phone");
const contactSelect = form.elements.namedItem("contact");
const fields = [nameInput, phoneInput, courseSelect, contactSelect];

function clearFieldError(field) {
  field.removeAttribute("aria-invalid");
  if (field === phoneInput) field.setAttribute("aria-describedby", "phone-help");
  else field.removeAttribute("aria-describedby");
}

function reportFieldError(field, message) {
  formError.textContent = message;
  field.setAttribute("aria-invalid", "true");
  field.setAttribute("aria-describedby", field === phoneInput ? "phone-help form-error" : "form-error");
  field.focus();
}

for (const field of fields) {
  field.addEventListener("input", () => {
    for (const item of fields) clearFieldError(item);
    formError.textContent = "";
    formSuccess.textContent = "";
  });
}

form.noValidate = true;
form.addEventListener("submit", (event) => {
  event.preventDefault();
  for (const field of fields) clearFieldError(field);
  formError.textContent = "";
  formSuccess.textContent = "";

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const digitCount = phone.replace(/\D/g, "").length;

  if (!name) return reportFieldError(nameInput, "Введите имя.");
  if (!/^\+?[0-9 ()-]+$/.test(phone) || digitCount < 7 || digitCount > 15) {
    return reportFieldError(phoneInput, "Введите телефон с 7–15 цифрами.");
  }
  if (!courseSelect.value) return reportFieldError(courseSelect, "Выберите курс.");
  if (!contactSelect.value) return reportFieldError(contactSelect, "Выберите способ связи.");

  try {
    const key = "cheksyz-ai-test-applications";
    const applications = JSON.parse(localStorage.getItem(key) ?? "[]");
    applications.push({ name, phone, course: courseSelect.value, contact: contactSelect.value, createdAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(applications));
  } catch {
    formError.textContent = "Не удалось сохранить заявку. Проверьте, разрешено ли локальное хранилище браузера, и повторите попытку.";
    return;
  }

  form.reset();
  formSuccess.textContent = "Тестовая заявка сохранена в этом браузере. Школа её не получит.";
});
document.querySelector("#application-fields").disabled = false;

