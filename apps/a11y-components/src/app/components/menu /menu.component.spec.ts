import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuComponentHarness } from './menu.component.harness';
import { Component, viewChild } from '@angular/core';
import { MenuComponent, MenuItem } from './menu.component';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import { isAllClosed } from './util/menu.functions';

@Component({
  selector: 'app-test-menu-wrapper',
  imports: [MenuComponent],
  template: `
    <app-components-menu
      [menuItems]="menuItems"
      (select)="onSelect()"
    ></app-components-menu> `,
})
export class TestMenuWrapperComponent {
  menuComponent = viewChild.required(MenuComponent);

  menuItems: MenuItem[] = [
    { label: 'Home', isOpen: false },
    { label: 'About', isOpen: false },
    {
      label: 'Services',
      isOpen: false,
      submenu: [
        {
          label: 'Web Design', submenu: [
            {
              label: 'Black White',
            },
            { label: 'Color' },
          ],
        },
        { label: 'SEO' },
      ],
    },
    { label: 'Contact', isOpen: false },
  ]

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onSelect() {}
}

describe('TestMenuWrapperComponent', () => {
  let fixture: ComponentFixture<TestMenuWrapperComponent>;
  let harness: MenuComponentHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [],
      imports: [],
    }).compileComponents();

    fixture = TestBed.createComponent(TestMenuWrapperComponent);
    harness =  await TestbedHarnessEnvironment.loader(fixture).getHarness(MenuComponentHarness);
    fixture.detectChanges();
  });

  it('should open the menu after clicking the button', async () => {
    await harness.toggleMenu();
    expect(fixture.componentInstance.menuComponent().isOpen()).toBe(true);
  });

  it('should close the menu after clicking the button', async () => {
    await harness.toggleMenu();
    expect(fixture.componentInstance.menuComponent().isOpen()).toBe(true);
    await harness.toggleMenu();
    expect(fixture.componentInstance.menuComponent().isOpen()).toBe(false);
  });

  it('should close the menu when clicked outside of it', async () => {
    await harness.toggleMenu();
    expect(fixture.componentInstance.menuComponent().isOpen()).toBe(true);
    await harness.clickOutside();
    expect(fixture.componentInstance.menuComponent().isOpen()).toBe(false);
  });

  /**
   * When a user activates a choice in a menu that has been opened, the menu usually closes.
   * If the menu choice action invokes a submenu, the menu will remain open and the submenu is displayed.
   */
  it('should close the menu after clicking item', async () => {
    await harness.toggleMenu();
    expect(fixture.componentInstance.menuComponent().isOpen()).toBe(true);
    await harness.clickItem(1);
    expect(fixture.componentInstance.menuComponent().isOpen()).toBe(false);
  });

  it('should not close the menu if clicked on submenu', async () => {
    await harness.toggleMenu();
    expect(fixture.componentInstance.menuComponent().isOpen()).toBe(true);
    await harness.clickSubmenu();
    expect(fixture.componentInstance.menuComponent().isOpen()).toBe(true);
  });

  /**
   * When a menu opens, keyboard focus is placed on the first menu item.
   */
  it('should focus first item in list after opening menu', async () => {
    await harness.toggleMenu();
    expect(await harness.isItemFocused(0)).toBe(true);
  });

  /**
   * To be keyboard accessible, you need to manage focus for all descendants: all menu items within the menu are focusable.
   * The menu button which opens the menu and the menu items, rather than the menu itself, are the focusable elements.
   */

  /** Escape
   * When in a submenu, it closes the submenu and moves focus to the parent menu or menubar item.
   * When in main menu, it closes it
   */
  it('should close the menu when pressed escape when not in a submenu', async () => {
    await harness.toggleMenu();
    expect(fixture.componentInstance.menuComponent().isOpen()).toBe(true);
    await harness.pressKeyOnListItem('Escape', 0);
    expect(fixture.componentInstance.menuComponent().isOpen()).toBe(false);
  })

  it('should not close the menu when pressed escape in a submenu', async () => {
    await harness.toggleMenu();
    expect(fixture.componentInstance.menuComponent().isOpen()).toBe(true);
    await harness.clickItem(2);
    await harness.pressKeyInSubmenu('Escape', 0);
    expect(fixture.componentInstance.menuComponent().isOpen()).toBe(true);
  })

  it('should focus first item after closing submenu', async () => {
    await harness.toggleMenu();
    await harness.clickItem(2);
    const menuComponent = fixture.componentInstance.menuComponent();
    const menuListComponent = menuComponent.menuListComponent();
    if(menuListComponent) {
      const spy = jest.spyOn(menuListComponent, 'focusFirstListItem');
      await harness.pressKeyInSubmenu('Escape', 0);
      expect(await harness.isItemFocused(0)).toBe(true);
      expect(spy).toHaveBeenCalled();
    }
  })

  it('should emit select when clicked on item in menu', async () => {
    const spy = jest.spyOn(fixture.componentInstance, 'onSelect');
    await harness.toggleMenu();
    await harness.clickItem(1);
    expect(spy).toHaveBeenCalled();
  })

  it('should emit select when clicked on item in sub menu', async () => {
    const spy = jest.spyOn(fixture.componentInstance, 'onSelect');
    await harness.toggleMenu();
    await harness.clickItem(2);
    await harness.clickOnSubListItem(1);
    expect(spy).toHaveBeenCalled();
  })

  it('should not emit select when clicked on sub menu', async () => {
    const spy = jest.spyOn(fixture.componentInstance, 'onSelect');
    await harness.toggleMenu();
    await harness.clickSubmenu();
    expect(spy).toHaveBeenCalledTimes(0);
  })

  it('should close all the submenus after clicking escape on main menu', async () => {
    await harness.toggleMenu();
    await harness.clickSubmenu();
    expect(isAllClosed(fixture.componentInstance.menuComponent().items())).toBe(false);
    await harness.pressKeyOnListItem('Escape', 2);
    expect(isAllClosed(fixture.componentInstance.menuComponent().items())).toBe(true);
  })

  it('should close all the nested submenus after clicking escape on submenu', async () => {
    await harness.toggleMenu();
    await harness.clickSubmenu();
    expect(isAllClosed(fixture.componentInstance.menuComponent().items())).toBe(false);
    await harness.pressKeyInSubmenu('Escape', 0);
    expect(isAllClosed(fixture.componentInstance.menuComponent().items()[2].submenu || [])).toBe(true);
  })

  it('should close all the submenus after selecting item', async () => {
    await harness.toggleMenu();
    await harness.clickSubmenu();
    expect(isAllClosed(fixture.componentInstance.menuComponent().items())).toBe(false);
    await harness.clickOnSubListItem(1);
    expect(isAllClosed(fixture.componentInstance.menuComponent().items()[2].submenu || [])).toBe(true);
    expect(isAllClosed(fixture.componentInstance.menuComponent().items())).toBe(true);
  })

  /**KEYBOARD NAVIGATION*/
  it('should open the menu if pressed enter on menu button', async () => {
    expect(fixture.componentInstance.menuComponent().isOpen()).toBe(false);
    await harness.pressKeyOnMenuButton('Enter');
    expect(fixture.componentInstance.menuComponent().isOpen()).toBe(true);
  });

  it('should open the menu if pressed space on menu button', async () => {
    expect(fixture.componentInstance.menuComponent().isOpen()).toBe(false);
    await harness.pressKeyOnMenuButton(' ');
    expect(fixture.componentInstance.menuComponent().isOpen()).toBe(true);
  });

  /**
   * Keyboard interactions
   * Space / Enter
   * If the item is a parent menu item, it opens the submenu and moves focus to the first item in the submenu. Otherwise, activates the menu item, which loads new content and places focus on the heading that titles the content.
   *
   * Escape
   * When in a submenu, it closes the submenu and moves focus to the parent menu or menubar item.
   *
   * Right Arrow
   * In a menubar, moves focus to the next item in the menubar. If focus is on the last item, it moves focus to the first item. If in a submenu, if focus is on an item that does not have a submenu, it closes the submenu and moves focus to the next item in the menubar. Otherwise, it opens the submenu of the newly focused menubar item, keeping focus on that parent menubar item. If not in a menubar or submenu and not on a menuitem with a submenu, if focus is not the last focusable element in the menu, it optionally moves focus to the next focusable element.
   *
   * Left Arrow
   * Moves focus to the previous item in the menubar. If focus is on the first item, it moves focus to the last item. If in a submenu, it closes the submenu and moves focus to the parent menu item. If not in a menubar or submenu, if focus is not the first focusable element in the menu, it optionally moves focus to the last focusable element.
   *
   * Down Arrow
   * Opens submenu and moves focus to the first item in the submenu.
   *
   * Up Arrow
   * Opens submenu and moves focus to the last item in the submenu.
   *
   * Home
   * Moves focus to the first item in the menubar.
   *
   * End
   * Moves focus to the last item in the menubar.
   *
   * Any character key
   * Moves focus to the next item in the menubar having a name that starts with the typed character. If none of the items have a name starting with the typed character, focus does not move.
   */
});


