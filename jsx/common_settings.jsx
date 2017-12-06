'use strict';

var CommonSettings = React.createClass({
    render: function() {
        return (
            <div className="gui_box grey">
                <div className="gui_box_titlebar">
                    <div className="spacer_box_title">Common Parameters</div>
                </div>
                <div className="spacer_box">
                    {this.renderControls()}
                </div>
            </div>
        );
    },
    handleChange: function(name, value, data) {        
        // @todo probably shouldn't alter props like this
        var escSettings = this.props.escSettings;
        escSettings.forEach(settings => settings[name] = value);
        if (!(data == null))
        {
            escSettings.forEach(settings => settings[name.toString().concat("DATA")] = data);
        }
        
        this.props.onUserInput(escSettings);
    },
    renderControls: function() {
        // filter escSettings to sieve unavailable ones
        const availableSettings = this.props.escSettings.filter((i, idx) => this.props.escMetainfo[idx].available);

        // ensure all ESCs have supported firmware version
        for (let i = 0; i < availableSettings.length; ++i) {
            const layoutRevision = availableSettings[i].LAYOUT_REVISION.toString();

            if (!(layoutRevision in BLHELI_SETTINGS_DESCRIPTIONS)) {
                return (
                    <h3>Version {availableSettings[i].MAIN_REVISION + '.' + availableSettings[i].SUB_REVISION} is unsupported</h3>
                );
            }
        }

        // ensure all ESCs are MULTI
        const allMulti = availableSettings.every(settings => settings.MODE === BLHELI_MODES.MULTI);
        if (!allMulti) {
            return (
                <h3>Only MULTI mode currently supported</h3>
            );
        }

        // @todo ensure valid MODE

        const masterSettings = availableSettings[0],
              layoutRevision = masterSettings.LAYOUT_REVISION,
              revision = masterSettings.MAIN_REVISION + '.' + masterSettings.SUB_REVISION,
              mode = blheliModeToString(masterSettings.MODE);

        // find specific UI overrides for this version
        var overrides = BLHELI_SETTINGS_DESCRIPTIONS[layoutRevision][mode].overrides;
        if (overrides) {
            overrides = overrides[revision];
        }

        return BLHELI_SETTINGS_DESCRIPTIONS[layoutRevision][mode].base.map(setting => {
            // @todo move elsewhere
            if (setting.visibleIf && !setting.visibleIf(masterSettings)) {
                return null;
            }

            const notInSync = availableSettings.reduce((x, y) => x[setting.name] === y[setting.name] ? x : -1) === -1,
                  override = overrides ? overrides.find(override => override.name === setting.name) : null;

            return this.renderSetting(masterSettings, notInSync, override ? override : setting);
        });
    },
    renderSetting: function(settings, notInSync, desc) {
        switch (desc.type) {
            case 'bool': {
                return (
                    <Checkbox
                        name={desc.name}
                        value={settings[desc.name]}
                        label={desc.label}
                        notInSync={notInSync}
                        onChange={this.handleChange}
                    />
                );
            }
            case 'enum': {
                // @todo redesign
                // Remove DampedLight option for ESCs that do not support it
                var options = desc.options;
                if (desc.name === 'PWM_FREQUENCY') {
                    const layout = settings.LAYOUT;
                    if (this.props.supportedESCs.layouts.SiLabs.hasOwnProperty(layout) && !this.props.supportedESCs.layouts.SiLabs[layout].damped_enabled ||
                        this.props.supportedESCs.layouts.Atmel.hasOwnProperty(layout) && !this.props.supportedESCs.layouts.Atmel[layout].damped_enabled) {
                        options = options.slice(0, -1);
                    }
                }
                return (
                    <Select
                        name={desc.name}
                        value={settings[desc.name]}
                        options={options}
                        label={desc.label}
                        notInSync={notInSync}
                        onChange={this.handleChange}
                    />
                );
            }
            case 'enumdata': {
                // @todo redesign
                var options = desc.options;
                return (
                    <SelectData
                        name={desc.name}
                        value={settings[desc.name]}
                        options={options}
                        label={desc.label}
                        data={desc.data}
                        notInSync={notInSync}
                        onChange={this.handleChange}
                    />
                );
            }
            case 'number': {
                return (
                    <Number
                        name={desc.name}
                        step={desc.step}
                        min={desc.min}
                        max={desc.max}
                        value={settings[desc.name]}
                        label={desc.label}
                        notInSync={notInSync}
                        onChange={this.handleChange}
                    />
                );
            }
            case 'textfield': { 
                return (
                    <TextField 
                        name={desc.name} 
                        value={settings[desc.name]}
                        placeholder={desc.placeholder} 
                        label={desc.label} 
                        notInSync={notInSync}
                        onChange={this.handleChange} 
                    /> 
                );
            } 
            default: throw new Error('Logic error');
        }
    }
});
