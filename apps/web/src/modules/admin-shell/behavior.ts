import type { Cleanup } from "../../shared/dom";
import { on } from "../../shared/dom";

type AddCleanupFn = (cleanup: Cleanup) => void;

type InitAdminShellBehaviorParams = {
  addCleanup: AddCleanupFn;
};

type InitAdminShellBehaviorResult = {
  setModalOpen: (name: string | null, isOpen: boolean) => void;
  setActiveView: (target: string | null) => void;
};

export const initAdminShellBehavior = ({
  addCleanup,
}: InitAdminShellBehaviorParams): InitAdminShellBehaviorResult => {
  const ensureScrollableModal = (modalName: string): void => {
    const modal = document.querySelector(`[data-modal="${modalName}"]`) as HTMLElement | null;
    const panel = modal?.firstElementChild as HTMLElement | null;
    if (!panel) return;
    panel.style.maxHeight = "90vh";
    panel.style.overflowY = "auto";
  };

  const tabButtons = document.querySelectorAll(".tab-button");
  const tabPanels = document.querySelectorAll("[data-tab-panel]");
  const activeTabClasses = ["bg-primary", "border-primary", "text-white"];
  const inactiveTabClasses = ["bg-white", "border-stone-200", "text-stone-700"];

  tabButtons.forEach((button) => {
    addCleanup(
      on(button, "click", () => {
        const target = button.getAttribute("data-tab-target");

        tabButtons.forEach((item) => {
          const isActive = item === button;
          item.classList.toggle("opacity-60", !isActive);
          activeTabClasses.forEach((cls) => item.classList.toggle(cls, isActive));
          inactiveTabClasses.forEach((cls) => item.classList.toggle(cls, !isActive));
        });

        tabPanels.forEach((panel) => {
          panel.classList.toggle("hidden", panel.getAttribute("data-tab-panel") !== target);
        });
      })
    );
  });

  const peopleTabButtons = document.querySelectorAll("[data-people-tab-target]");
  const peopleTabPanels = document.querySelectorAll("[data-people-tab-panel]");
  const peopleUsersAction = document.querySelector("[data-people-users-action]") as HTMLElement | null;

  const setActivePeopleTab = (target: string | null) => {
    peopleTabButtons.forEach((item) => {
      const tabTarget = item.getAttribute("data-people-tab-target");
      const isActive = tabTarget === target;
      item.classList.toggle("opacity-60", !isActive);
      activeTabClasses.forEach((cls) => item.classList.toggle(cls, isActive));
      inactiveTabClasses.forEach((cls) => item.classList.toggle(cls, !isActive));
    });
    peopleTabPanels.forEach((panel) => {
      panel.classList.toggle("hidden", panel.getAttribute("data-people-tab-panel") !== target);
    });
    if (peopleUsersAction) {
      peopleUsersAction.classList.toggle("hidden", target !== "usuarios");
    }
  };

  peopleTabButtons.forEach((button) => {
    addCleanup(
      on(button, "click", () => {
        setActivePeopleTab(button.getAttribute("data-people-tab-target"));
      })
    );
  });
  if (peopleTabButtons.length > 0) {
    setActivePeopleTab(peopleTabButtons[0].getAttribute("data-people-tab-target"));
  }

  const viewTriggers = document.querySelectorAll("[data-view-trigger]");
  const viewPanels = document.querySelectorAll("[data-view]");

  const setActiveView = (target: string | null) => {
    viewPanels.forEach((panel) => {
      panel.classList.toggle("hidden", panel.getAttribute("data-view") !== target);
    });
    viewTriggers.forEach((trigger) => {
      trigger.classList.toggle("sidebar-item--active", trigger.getAttribute("data-view-trigger") === target);
      trigger.classList.toggle("sidebar-item--inactive", trigger.getAttribute("data-view-trigger") !== target);
    });
  };

  viewTriggers.forEach((trigger) => {
    addCleanup(
      on(trigger, "click", () => {
        setActiveView(trigger.getAttribute("data-view-trigger"));
      })
    );
  });

  const setModalOpen = (name: string | null, isOpen: boolean) => {
    if (!name) return;
    const modal = document.querySelector(`[data-modal="${name}"]`);
    if (!modal) return;
    modal.classList.toggle("hidden", !isOpen);
    modal.classList.toggle("flex", isOpen);
    modal.setAttribute("aria-hidden", String(!isOpen));
  };

  const openModalButtons = document.querySelectorAll("[data-open-modal]");
  const closeModalButtons = document.querySelectorAll("[data-close-modal]");

  openModalButtons.forEach((button) => {
    addCleanup(on(button, "click", () => setModalOpen(button.getAttribute("data-open-modal"), true)));
  });

  closeModalButtons.forEach((button) => {
    addCleanup(on(button, "click", () => setModalOpen(button.getAttribute("data-close-modal"), false)));
  });

  ensureScrollableModal("user-create");
  ensureScrollableModal("user-edit");
  ensureScrollableModal("assinantes-form");
  ensureScrollableModal("professional-work-profiles");
  ensureScrollableModal("professional-commission-profiles");

  addCleanup(
    on(document, "keydown", (event) => {
      if (!(event instanceof KeyboardEvent) || event.key !== "Escape") return;
      document.querySelectorAll("[data-modal]").forEach((modal) => {
        if (!modal.classList.contains("hidden")) {
          setModalOpen(modal.getAttribute("data-modal"), false);
        }
      });
    })
  );

  return { setModalOpen, setActiveView };
};
