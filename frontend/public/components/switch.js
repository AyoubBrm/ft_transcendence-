export function setupSwitches() {
    const switch1 = document.getElementById('switch-1');
    const switch2 = document.getElementById('switch-2');

    const toggleSwitch = (selectedSwitch, otherSwitch) => {
        selectedSwitch.setAttribute('data-state', 'on');
        selectedSwitch.style.backgroundColor = '#FBCC0A';
        otherSwitch.setAttribute('data-state', 'off');
        otherSwitch.style.backgroundColor = '#383838';
    };

    // switch1.addEventListener('click', () => toggleSwitch(switch1, switch2));
    // switch2.addEventListener('click', () => toggleSwitch(switch2, switch1));
}
