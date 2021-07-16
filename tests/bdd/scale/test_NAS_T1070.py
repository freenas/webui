# coding=utf-8
"""SCALE UI feature tests."""

import time
from function import(
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    ssh_sudo,
    wait_on_element_disappear,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T1070.feature', 'Enable user Permit Sudo')
def test_enable_user_permit_sudo():
    """Enable user Permit Sudo."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the FreeNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you should be on the dashboard')
def you_should_be_on_the_dashboard(driver):
    """you should be on the dashboard."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')


@then('click on the Credentials on the side menu, click on Local Users')
def click_on_the_credentials_on_the_side_menu_click_on_local_users(driver):
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Local Users"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Local Users"]').click()


@then('click the down caret right of the users, then click the Edit button')
def click_the_down_caret_right_of_the_users(driver):
    """click the down caret right of the users, then click the Edit button."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//tr[@ix-auto="expander__ericbsd"]/td', 'clickable')
    driver.find_element_by_xpath('//tr[@ix-auto="expander__ericbsd"]/td').click()
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__EDIT_ericbsd"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_ericbsd"]').click()


@then('click Enable Permit Sudo checkbox and click save')
def click_enable_permit_sudo_checkbox_and_click_save(driver):
    """click Enable Permit Sudo checkbox and click save."""
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    element = driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(5)
    value_exist = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Permit Sudo"]', 'class', 'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Permit Sudo"]').click()
    wait_on_element(driver, 10, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()

@then('the changes should be saved')
def the_changes_should_be_saved(driver):
    """the changes should be saved."""
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Local Users"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Local Users"]').click()


@then('open the user dropdown')
def open_the_user_dropdown(driver):
    """open the user dropdown."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]', 'clickable')
    assert wait_on_element(driver, 10, '//tr[@ix-auto="expander__ericbsd"]/td', 'clickable')
    driver.find_element_by_xpath('//tr[@ix-auto="expander__ericbsd"]/td').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__EDIT_ericbsd"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_ericbsd"]').click()

@then('updated value should be visible')
def updated_value_should_be_visible(driver):
    """updated value should be visible."""
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    element = driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    value_exist = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Permit Sudo"]', 'class', 'mat-checkbox-checked')
    assert wait_on_element(driver, 10, '//*[@id="close-icon"]', 'clickable')
    driver.find_element_by_xpath('//*[@id="close-icon"]').click()
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    time.sleep(1)

@then('open a shell and run su user to become that user')
def open_a_shell_and_run_su_user_to_become_that_user(driver, nas_ip):
    """open a shell and run su user to become that user."""
    global sudo_results
    cmd = 'ls /tmp'
    sudo_results = ssh_sudo(cmd, nas_ip, 'ericbsd', 'testing')


@then('the user should be able to use Sudo')
def the_user_should_be_able_to_use_sudo(driver):
    """the user should be able to use Sudo."""
    assert "ix-applications" in sudo_results, str(sudo_results)
