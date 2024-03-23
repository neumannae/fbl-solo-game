/**
 * Class representing the Forbidden Lands - Solo Game Module.
 */
class FBLSoloGame {
    static ID = 'fbl-solo-game';
    static NAME = 'FBLSoloGame';
    static #DEBUG = true;
    static #DEBUGHOOKS = false;
    static #TRE = []; /* Terrain Random Encounters */

    /* INIT */

    /**
     * Initializing the Forbidden Lands - Solo Game Module
     * Called once from Foundry VTT hook 'init'
     */
    static async init() {
        this.log(true, `Initializing the 'Forbidden Lands: Solo Game' Module`);

        if (this.#DEBUGHOOKS) CONFIG.debug.hooks = true;

        /* Load templates */
        await loadTemplates([
            `modules/${this.ID}/templates/copyChat.hbs`,
            `modules/${this.ID}/templates/drawCard.hbs`,
            `modules/${this.ID}/templates/insertJournal.hbs`,
            `modules/${this.ID}/templates/rollD66.hbs`,
            `modules/${this.ID}/templates/rollWeather.hbs`,
            `modules/${this.ID}/templates/selectDialog.hbs`
        ]);

        /* Register game settings */
        this.#TRE = await fetchJsonWithTimeout(`modules/${this.ID}/assets/terrainRandomEncounter.json`);

        game.settings.register(this.ID, 'importAdventure', {
            name: 'Import Adventure',
            scope: 'world',
            config: false,
            type: Boolean,
            default: false
        });

        game.settings.register(this.ID, 'contextMenuCopy', {
            name: `${this.ID}.settings.contextmenu.copy.label`,
            hint: `${this.ID}.settings.contextmenu.copy.hint`,
            scope: 'client',
            config: true,
            requiresReload: false,
            type: Boolean,
            default: true
        });

        game.settings.register(this.ID, 'contextMenuCopyAsHTML', {
            name: `${this.ID}.settings.contextmenu.copyashtml.label`,
            hint: `${this.ID}.settings.contextmenu.copyashtml.hint`,
            scope: 'client',
            config: true,
            requiresReload: false,
            type: Boolean,
            default: false
        });

        game.settings.register(this.ID, 'contextMenuInsert', {
            name: `${this.ID}.settings.contextmenu.insert.label`,
            hint: `${this.ID}.settings.contextmenu.insert.hint`,
            scope: 'client',
            config: true,
            requiresReload: false,
            type: Boolean,
            default: true
        });

        game.settings.register(this.ID, 'travelJournal', {
            name: `${this.ID}.settings.travelJournal.name`,
            hint: `${this.ID}.settings.travelJournal.hint`,
            scope: 'client',
            config: true,
            requiresReload: false,
            type: String,
            default: 'pwkz6GEXJgKMc5ja',
            onChange: async journal => {
                if (!(await game.journal.get(journal) ?? game.journal.getName(journal))) {
                    ui.notifications.error(game.i18n.format(`${this.ID}.settings.travelJournal.error`, { idOrName: journal }), { permanent: true });
                    game.settings.storage.get('client').removeItem(`${this.ID}.travelJournal`)
                }
            }
        });

        game.settings.register(this.ID, 'travelJournalPage', {
            name: `${this.ID}.settings.travelJournalPage.name`,
            hint: `${this.ID}.settings.travelJournalPage.hint`,
            scope: 'client',
            config: true,
            requiresReload: false,
            type: String,
            default: 'UKWRSoihd9bxbiv2',
            onChange: async page => {
                let travelJournal = game.settings.get(this.ID, 'travelJournal');
                let journal = await game.journal.get(travelJournal) ?? game.journal.getName(travelJournal);

                if (!(await journal.pages.get(page) ?? journal.pages.getName(page))) {
                    ui.notifications.error(game.i18n.format(`${this.ID}.settings.travelJournalPage.error`, { idOrName: page }), { permanent: true });
                    game.settings.storage.get('client').removeItem(`${this.ID}.travelJournalPage`);
                };
            }
        });

        game.settings.register(this.ID, 'travelJournalPagePrepend', {
            name: `${this.ID}.settings.travelJournalPage.prepend.label`,
            hint: `${this.ID}.settings.travelJournalPage.prepend.hint`,
            scope: 'client',
            config: true,
            requiresReload: false,
            type: Boolean,
            default: false
        });

        game.settings.register(this.ID, 'routeTracking', {
            name: `${this.ID}.settings.routetracking.track.label`,
            hint: `${this.ID}.settings.routetracking.track.hint`,
            scope: 'client',
            config: true,
            requiresReload: false,
            type: Boolean,
            default: true
        });

        game.settings.register(this.ID, 'routeTrackingScenes', {
            name: `${this.ID}.settings.routetracking.scenes.label`,
            hint: `${this.ID}.settings.routetracking.scenes.hint`,
            scope: 'client',
            config: true,
            requiresReload: false,
            type: String,
            default: 'vDd045IzUqVlE6a3, d2yThKHwtHPHdtlv, VdOjTXFYLBPOPaqv',
            onChange: async scenes => {
                scenes.split(',').forEach(async scene => {
                    if (!(await game.scenes.get(scene.trim()) ?? game.scenes.getName(scene.trim()))) {
                        ui.notifications.error(game.i18n.format(`${this.ID}.settings.routetracking.scenes.error`, { idOrName: scene }), { permanent: true });
                        game.settings.storage.get('client').removeItem(`${this.ID}.routeTrackingScenes`);
                    };
                });
            }
        });

        game.settings.register(this.ID, 'routeTrackingActors', {
            name: `${this.ID}.settings.routetracking.actors.label`,
            hint: `${this.ID}.settings.routetracking.actors.hint`,
            scope: 'client',
            config: true,
            requiresReload: false,
            type: String,
            default: 'yBj1R7df5DKEPSrL',
            onChange: async actors => {
                actors.split(',').forEach(async actor => {
                    if (!(await game.actors.get(actor.trim()) ?? game.actors.getName(actor.trim()))) {
                        ui.notifications.error(game.i18n.format(`${this.ID}.settings.routetracking.actors.error`, { idOrName: actor }), { permanent: true });
                        game.settings.storage.get('client').removeItem(`${this.ID}.routeTrackingActors`);
                    };
                });
            }
        });

        game.settings.register(this.ID, 'routeTrackingTileOpacity', {
            name: `${this.ID}.settings.routetracking.tileOpacity.label`,
            hint: `${this.ID}.settings.routetracking.tileOpacity.hint`,
            scope: 'client',
            config: true,
            requiresReload: false,
            type: Number,
            range: {
                min: 0,
                max: 1,
                step: .1
            },
            default: .5
        });

        game.settings.register(this.ID, 'routeTrackingTileTint', {
            name: `${this.ID}.settings.routetracking.tileTint.label`,
            hint: `${this.ID}.settings.routetracking.tileTint.hint`,
            scope: 'client',
            config: true,
            requiresReload: false,
            type: String,
            default: '#FFFFFF',
            onChange: async tint => {
                if (!/^#(?:[0-9a-f]{3}){1,2}$/i.test(tint)) {
                    ui.notifications.error(game.i18n.format(`${this.ID}.settings.routetracking.tileTint.error`, { idOrName: tint }), { permanent: true });
                    game.settings.storage.get('client').removeItem(`${this.ID}.routeTrackingTileTint`);
                };
            }
        });

        this.#TRE.forEach(elm => {
            let terrain = Object.keys(elm)[0];
            let table = elm[terrain].tables.join(', ');

            game.settings.register(this.ID, terrain, {
                name: game.i18n.format(`${this.ID}.settings.randomEncounters.label`, { label: game.i18n.localize(game.fbl.config.i18n[terrain]) }),
                hint: `${this.ID}.settings.randomEncounters.hint`,
                scope: 'client',
                config: true,
                requiresReload: false,
                type: String,
                default: table,
                onChange: async value => {
                    value.split(',').forEach(async table => {
                        if (!(await game.tables.get(table.trim()) ?? game.tables.getName(table.trim()))) {
                            ui.notifications.error(game.i18n.format(`${this.ID}.settings.randomEncounters.error`, { idOrName: table }), { permanent: true });
                            game.settings.storage.get('client').removeItem(`${this.ID}.${terrain}`);
                        };
                    });
                }
            });
        });

        /* Config TextEditor Enrichers */
        CONFIG.TextEditor.enrichers.push({
            pattern: /\[(d)\]/gim,
            enricher: async () => $('<i />', { 'class': 'fas fa-tint', 'data-tooltip': game.i18n.localize(`${this.ID}.message.fbl.damage`) })[0]
        }, {
            pattern: /\b(?<oracle>loot|yes\/no oracle|helpful\/hazardous oracle|theme oracle|wilderness oracle|kin oracle|kin names oracle|traits oracle)\b/gi,
            enricher: async match => {
                switch (match.groups.oracle.toLowerCase()) {
                    case 'loot':
                        return $(await TextEditor.enrichHTML(`@FBL[Draw.A7MXBZ4aKdjMt5Hn]{Loo&ZeroWidthSpace;t}`))[0];
                    case 'yes/no oracle':
                        return $(await TextEditor.enrichHTML(`@FBL[Draw.XDhNAmdAsHWolOX7]{Yes/No Oracl&ZeroWidthSpace;e}`))[0];
                    case 'helpful/hazardous oracle':
                        return $(await TextEditor.enrichHTML(`@FBL[Draw.keaUV2QouZoimeK8]{Helpful/Hazardous Oracl&ZeroWidthSpace;e}`))[0];
                    case 'theme oracle':
                        return $(await TextEditor.enrichHTML(`@FBL[Draw.ZnBBMg2wkqWJc9rU]{Theme Oracl&ZeroWidthSpace;e}`))[0];
                    case 'wilderness oracle':
                        return $(await TextEditor.enrichHTML(`@FBL[Draw.OINDIreOhZlh6hwD]{Wilderness Oracl&ZeroWidthSpace;e}`))[0];
                    case 'kin oracle':
                        return $(await TextEditor.enrichHTML(`@FBL[Draw.hMcHIuop7DFXPUFi]{Kin Oracl&ZeroWidthSpace;e}`))[0];
                    case 'kin names oracle':
                        return $(await TextEditor.enrichHTML(`@FBL[Draw.2ue7vlSiZ95ajQWq]{Kin Names Oracl&ZeroWidthSpace;e}`))[0];
                    case 'traits oracle':
                        return $(await TextEditor.enrichHTML(`@FBL[Draw.i0q7eZifJB2BSoaw]{Traits Oracl&ZeroWidthSpace;e}`))[0];
                    default:
                        return match.groups.oracle;
                }
            }
        }, {
            pattern: /\[(?<suit>spades|clubs|hearts|diamonds)\]/gim,
            enricher: async match => {
                let { suit, face } = match.groups;
                let color = (suit === 'spades' || suit === 'clubs') ? 'black' : 'red';
                let html = new Map([['spades', '&#x2660'], ['clubs', '&#x2663'], ['hearts', '&#x2665'], ['diamonds', '&#x2666']]);

                return $('<span />', { 'class': `fbl-solo-game fbl-solo-game-cards fbl-solo-game-cards-${color}`, 'data-tooltip': game.i18n.localize(`${this.ID}.card.suit.${suit}`), 'html': html.get(suit) })[0];
            }
        }, {
            pattern: /@FBL\[(?<config>[^\]]+)](?:{(?<label>[^}]+)})?/gim,
            enricher: async match => {
                let { config, label } = match.groups;
                let [type, uuid] = config.split('.');
                let options = {
                    'class': 'content-link broken',
                    'data-tooltip': game.i18n.localize(`${this.ID}.message.contentlink.broken`),
                    'html': `<i class="fas fa-unlink"></i>${uuid}`
                };

                if (['Roll', 'Draw', 'Macro'].includes(type)) {
                    let object = game.tables.get(uuid) ?? game.tables.getName(uuid) ?? game.macros.get(uuid) ?? game.macros.getName(uuid);
                    let name = label ?? object.name;

                    options = {
                        'class': 'content-link',
                        'data-tooltip': name,
                        'html': `<i class="fas fa-${new Map([['Roll', 'dice'], ['Draw', 'cards'], ['Macro', 'code'],]).get(type)}"></i>${name}`,
                        'onclick': object.documentName === 'RollTable' ? `game.tables.get('${object.id}').draw();` : `game.macros.get('${object.id}').execute();`
                    };
                }

                return $('<a />', options)[0];
            }
        });

        /* @override FBL settings for successes */
        CONFIG.TextEditor.enrichers[CONFIG.TextEditor.enrichers.findIndex(e => String(e.pattern) == String(/\[(x)\]/gim))] = {
            pattern: /\[(x)\]/gim,
            enricher: async match => $('<span />', { 'class': 'fbl-swords', 'data-tooltip': game.i18n.localize(`${this.ID}.message.fbl.success`), 'html': match[1] })[0]
        };

        /* @override FBL settings for banes */
        CONFIG.TextEditor.enrichers[CONFIG.TextEditor.enrichers.findIndex(e => String(e.pattern) == String(/\[(l)\]/gim))] = {
            pattern: /\[(l)\]/gim,
            enricher: async match => $('<span />', { 'class': 'fbl-skull', 'data-tooltip': game.i18n.localize(`${this.ID}.message.fbl.bane`), 'html': match[1] })[0]
        };

        /* @override FBL settings for @Draw */
        CONFIG.TextEditor.enrichers[CONFIG.TextEditor.enrichers.findIndex(e => String(e.pattern) == String(/@Draw\[(.+?)\]/gim))] = {
            pattern: /@Draw\[(?<config>[^\]]+)](?:{(?<label>[^}]+)})?/gim,
            enricher: async match => {
                switch (match.groups.config.toLowerCase()) {
                    case 'motivations':
                        return $(await TextEditor.enrichHTML(`@FBL[Draw.Iahs7UKb4h826PCJ]{Motivation&ZeroWidthSpace;s}`))[0];
                    case 'talents':
                        return $(await TextEditor.enrichHTML(`@FBL[Draw.oAoUPD5AKUvmI3z6]{Talent&ZeroWidthSpace;s}`))[0];
                    case 'weather':
                        return $(await TextEditor.enrichHTML(`@FBL[Roll.hOzUpdm3X8dI0kkR]{Weathe&ZeroWidthSpace;r}`))[0];
                    case 'encounter types':
                        return $(await TextEditor.enrichHTML(`@FBL[Draw.RBiZU70kqvI1fWue]{Encounter Type&ZeroWidthSpace;s}`))[0];
                    case 'general encounters':
                        return $(await TextEditor.enrichHTML(`@FBL[Draw.dYpVcGPvp8Z80CNE]{General Encounter&ZeroWidthSpace;s}`))[0];
                    default:
                        return $(await TextEditor.enrichHTML(`@FBL[Roll.${match.groups.config}]`))[0];
                }
            }
        };

        /* Provide API */
        game[this.NAME.toLowerCase()] = {
            rollD66: this.#rollD66,
            rollWeather: this.#rollWeather,
            rollLocation: this.#rollLocation,
            drawYesNoOracle: this.#drawYesNoOracle,
            drawHelpfulHazardousOracle: this.#drawHelpfulHazardousOracle,
            drawThemeOracle: this.#drawThemeOracle,
            drawWildernessOracle: this.#drawWildernessOracle,
            drawKinOracle: this.#drawKinOracle,
            drawKinNameOracle: this.#drawKinNameOracle,
            drawTraitsOracle: this.#drawTraitsOracle,
            drawLoot: this.#drawLoot,
            drawEncouterType: this.#drawEncouterType,
            drawGeneralEncouter: this.#drawGeneralEncouter,
            generateAdventureSite: this.#generateAdventureSite,
            selectRandomEncounter: this.#selectRandomEncounter,
            drawMotivations: this.#drawMotivations,
            drawTalents: this.#drawTalents
        };

        /* Hooks once */
        /**
         * As soon as Foundry VTT has been ready, Forbidden Lands - Solo Game Adventure import check starts
         */
        Hooks.once("ready", async () => {
            /* Import Adventure */
            if (!game.settings.get(this.ID, 'importAdventure') && game.user.isGM) {
                this.log(this.#DEBUG, 'importAdventure');

                await game.packs.get(`${this.ID}.${this.ID}`).getDocuments().then((docs) => {
                    docs[0].sheet.render(true);
                    game.settings.set(this.ID, 'importAdventure', true);
                });
            };
        });

        /* Hooks on */
        /**
         * Fires for each Settings Config Dialog which is rendered for the Application. Forbidden Lands - Solo Game Module makes some changes
         */
        Hooks.on('renderSettingsConfig', (_settingsConfig, html, _dialogData) => {
            this.log(this.#DEBUG, 'renderSettingsConfig', html);

            html.find(`[data-setting-id="${this.ID}.contextMenuCopy"]`).before(`<p><b>${game.i18n.localize(`${this.ID}.settings.contextmenu.section`)}</b></p>`);
            html.find(`[data-setting-id="${this.ID}.travelJournal"]`).before(`<p><b>${game.i18n.localize(`${this.ID}.settings.travelJournal.section`)}</b></p>`);
            html.find(`[data-setting-id="${this.ID}.routeTracking"]`).before(`<p><b>${game.i18n.localize(`${this.ID}.settings.routetracking.section`)}</b></p>`);
            html.find(`[data-setting-id="${this.ID}.plains"]`).before(`<p><b>${game.i18n.localize(`${this.ID}.settings.randomEncounters.section`)}</b></p>`);

            html.find(`[name="${this.ID}.routeTrackingTileTint"]`).parent().append(`<input type="color" value="${game.settings.get(this.ID, 'routeTrackingTileTint')}" data-edit="${this.ID}.routeTrackingTileTint">`);
        });

        /**
         * Fires for each Dialog which is rendered for the Application. Forbidden Lands - Solo Game Module makes some changes
         */
        Hooks.on('renderDialog', (dialog, html, _dialogData) => {
            this.log(this.#DEBUG, 'renderDialog', dialog, html);

            if (dialog.options?.flags?.[this.ID]?.type === 'generateAdventureSite') {
                html.find('h4.window-title').text(game.i18n.localize(`${this.ID}.dialog.generateAdventureSite.title`));
                html.find('input[name="name"]').val(dialog.options.flags[this.ID].name).select();
                html.find('select[name="type"]').prop('disabled', true);
            };
        });

        /**
         * Fires when the chat log context menu is constructed, then add Forbidden Lands - Solo Game Module menu entries
         */
        Hooks.on('getChatLogEntryContext', (_html, entryOptions) => {
            this.log(this.#DEBUG, 'getChatLogEntryContext', entryOptions);

            let contextMenuCopyIcon = '<i class="fas fa-copy"></i>';
            let contextMenuCopyGroup = `${this.ID}.contextMenuCopy`;
            let contextMenuCopyCondition = game.settings.get(this.ID, 'contextMenuCopy');

            let contextMenuInsertJournal = game.settings.get(this.ID, 'importAdventure') ?
                game.journal.get(game.settings.get(this.ID, 'travelJournal')).pages.get(game.settings.get(this.ID, 'travelJournalPage')).name :
                game.i18n.localize(`${this.ID}.settings.travelJournal.name`);
            let contextMenuInsertIcon = '<i class="fas fa-file-import"></i>';
            let contextMenuInsertGroup = `${this.ID}.contextMenuInsert`;
            let contextMenuInsertCondition = game.settings.get(this.ID, 'contextMenuInsert');

            let contextMessageCondition = ['Foundry Virtual Tabletop', 'Dice So Nice!'];

            entryOptions.push({
                name: game.i18n.localize(`${this.ID}.menu.copy.date`),
                icon: contextMenuCopyIcon,
                group: contextMenuCopyGroup,
                condition: header => {
                    let message = game.messages.get(header.data("messageId"));

                    return contextMenuCopyCondition && !contextMessageCondition.includes(message.speaker.alias);
                },
                callback: header => {
                    this.#copyDate(header);
                }
            }, {
                name: game.i18n.localize(`${this.ID}.menu.copy.quater`),
                icon: contextMenuCopyIcon,
                group: contextMenuCopyGroup,
                condition: header => {
                    let message = game.messages.get(header.data("messageId"));

                    return contextMenuCopyCondition && !contextMessageCondition.includes(message.speaker.alias);
                },
                callback: header => {
                    this.#copyQuater(header);
                }
            }, {
                name: game.i18n.localize(`${this.ID}.menu.copy.message`),
                icon: contextMenuCopyIcon,
                group: contextMenuCopyGroup,
                condition: header => {
                    let message = game.messages.get(header.data("messageId"));

                    return contextMenuCopyCondition && !contextMessageCondition.includes(message.speaker.alias);
                },
                callback: header => {
                    this.#copyMessage(header);
                }
            }, {
                name: game.i18n.format(`${this.ID}.menu.insert.date`, { journal: contextMenuInsertJournal }),
                icon: contextMenuInsertIcon,
                group: contextMenuInsertGroup,
                condition: header => {
                    let message = game.messages.get(header.data("messageId"));

                    return contextMenuInsertCondition && !contextMessageCondition.includes(message.speaker.alias);
                },
                callback: header => {
                    this.#insertDate(header);
                }
            }, {
                name: game.i18n.format(`${this.ID}.menu.insert.quater`, { journal: contextMenuInsertJournal }),
                icon: contextMenuInsertIcon,
                group: contextMenuInsertGroup,
                condition: header => {
                    let message = game.messages.get(header.data("messageId"));

                    return contextMenuInsertCondition && !contextMessageCondition.includes(message.speaker.alias);
                },
                callback: header => {
                    this.#insertQuater(header);
                }
            }, {
                name: game.i18n.format(`${this.ID}.menu.insert.message`, { journal: contextMenuInsertJournal }),
                icon: contextMenuInsertIcon,
                group: contextMenuInsertGroup,
                condition: header => {
                    let message = game.messages.get(header.data("messageId"));

                    return contextMenuInsertCondition && !contextMessageCondition.includes(message.speaker.alias);
                },
                callback: header => {
                    this.#insertMessage(header);
                }
            });
        });

        /**
         * Fires for each ChatMessage which is rendered for addition to the ChatLog, then change Forbidden Lands - Solo Game Module things
        */
        Hooks.on('renderChatMessage', (message, html, _messageData) => {
            this.log(this.#DEBUG, 'renderChatMessage', message, html);

            html.find('.message-timestamp').hide().after( `<time class='fbl-solo-game-message-timestamp'>${this.#getDate(message).short}</time>` );
        });

        /**
         * Fires for each Token which is moved on the canvas. Forbidden Lands - Solo Game Module makes some changes
         */
        Hooks.on('preUpdateToken', (token, change, _options, _userId) => {
            this.log(this.#DEBUG, 'preUpdateToken', token, change);

            if (!game.settings.get(this.ID, 'routeTracking')) return;
            if (!game.settings.get(FBLSoloGame.ID, 'routeTrackingActors').split(',')
                .filter(actor => game.actors.get(actor.trim()) ?? game.actors.getName(actor.trim()))
                .map(actor => (game.actors.get(actor) ?? game.actors.getName(actor)).id)
                .includes(token.actorId)) return;
            if (!game.settings.get(FBLSoloGame.ID, 'routeTrackingScenes').split(',')
                .filter(scene => game.scenes.get(scene.trim()) ?? game.scenes.getName(scene.trim()))
                .map(scene => (game.scenes.get(scene) ?? game.scenes.getName(scene)).id)
                .includes(game.scenes.current.id)) return;

            let size = game.scenes.current.grid.size;

            if (Math.abs(token.x - change.x) > size || Math.abs(token.y - change.y) > size) {
                ui.notifications.notify(game.i18n.localize(`${this.ID}.settings.routetracking.track.error`));

                return false;
            } else {
                let start = 'mid-to-north'; // to north
                let end = 'south-to-mid';

                if (!change.x) {
                    if (token.y > change.y) {
                        this.log(this.#DEBUG, 'to north');
                    } else {
                        this.log(this.#DEBUG, 'to south');
                        start = 'mid-to-south';
                        end = 'north-to-mid';
                    }
                } else if (token.x > change.x) {
                    if (token.y > change.y) {
                        this.log(this.#DEBUG, 'to north-west');
                        start = 'mid-to-north-west';
                        end = 'south-east-to-mid';
                    } else {
                        this.log(this.#DEBUG, 'to south-west');
                        start = 'mid-to-south-west';
                        end = 'north-east-to-mid';
                    }
                } else {
                    if (token.y > change.y) {
                        this.log(this.#DEBUG, 'to north-east');
                        start = 'mid-to-north-east';
                        end = 'south-west-to-mid';
                    } else {
                        this.log(this.#DEBUG, 'to south-east');
                        start = 'mid-to-south-east';
                        end = 'north-west-to-mid';
                    }
                }

                let path = `modules/${this.ID}/assets/tiles/footsteps/`;
                let alpha = game.settings.get(this.ID, 'routeTrackingTileOpacity');
                let tint = game.settings.get(this.ID, 'routeTrackingTileTint');

                canvas.scene.createEmbeddedDocuments('Tile', [
                    { texture: { src: `${path}${start}.svg`, tint: tint }, width: size, height: size, x: token.x, y: token.y, alpha: alpha },
                    { texture: { src: `${path}${end}.svg`, tint: tint }, width: size, height: size, x: change.x || token.x, y: change.y, alpha: alpha }
                ]);

                return true;
            };

        });

        /**
         * Fires after an Adventure has been imported into the World. Forbidden Lands - Solo Game Module shows hint
         */
        Hooks.on('importAdventure', async (adventure, _formData, _created, _updated) => {
            this.log(this.#DEBUG, 'importAdventure', adventure);

            if (!adventure.pack.startsWith(this.ID)) return;

            ui.notifications.notify(game.i18n.localize(`${this.ID}.import.adventure.info`));

            let journal = game.settings.get(this.ID, 'travelJournal');

            (await game.journal.get(journal) ?? game.journal.getName(journal)).sheet.render(true);

            if (game.modules.get('dice-so-nice')?.active) {
                game.settings.set('core', 'animateRollTable', false);
                game.settings.set('dice-so-nice', 'animateRollTable', true);
            }

            Dialog.confirm({
                title: game.i18n.localize(`${this.ID}.dialog.simpleCalendar.title`),
                content: game.i18n.localize(`${this.ID}.dialog.simpleCalendar.content`),
                yes: async () => {
                    this.log(this.#DEBUG, 'SimpleCalendar config');

                    if (await SimpleCalendar.api.configureCalendar('forbidden-lands')) {
                        let setTime = setInterval(() => {
                            if (SimpleCalendar.api.currentDateTime().hour === 6) {
                                let c = $('#tools-panel-token');
                                let p = $('#tools-panel-token').position();
                                let t = parseInt(p.top);
                                let l = parseInt(p.left) + parseInt(c.children(':first').css('width')) + parseInt(c.prev().css('margin-right'));

                                game.settings.set('foundryvtt-simple-calendar', 'forbidden-lands.theme', 'dark');
                                game.settings.set('foundryvtt-simple-calendar', 'open-on-load', true);
                                game.settings.set('foundryvtt-simple-calendar', 'open-compact', true);
                                game.settings.set('foundryvtt-simple-calendar', 'remember-compact-position', true);
                                game.settings.set('foundryvtt-simple-calendar', 'app-compact-position', { 'top': t, 'left': l });

                                SimpleCalendar.api.showCalendar(null, true);

                                ui.notifications.notify(game.i18n.localize(`${this.ID}.dialog.simpleCalendar.success`));
                                clearInterval(setTime);
                            } else {
                                SimpleCalendar.api.advanceTimeToPreset(SimpleCalendar.api.PresetTimeOfDay.Sunrise);
                            };
                        }, 100);
                    } else {
                        ui.notifications.notify(game.i18n.localize(`${this.ID}.dialog.simpleCalendar.error`));
                    }
                },
                defaultYes: true
            });
        });
    };

    /* MACROS */

    /**
     * Roll a D66
     * 
     * Call in macro with type script:
     * game.fblsologame.rollD66();
     */
    static async #rollD66() {
        FBLSoloGame.log(FBLSoloGame.#DEBUG, 'rollD66');

        let roll = await new Roll(`1ds*10+1ds`).roll();
        let template = `modules/${FBLSoloGame.ID}/templates/rollD66.hbs`;
        let content = await renderTemplate(template, {
            d66: game.i18n.localize(`${FBLSoloGame.ID}.roll.dice.d66`),
            total: roll.total,
            dice: [{
                type: roll.dice[0].type, total: roll.dice[0].total,
                max: roll.dice[0].total === 6 ? ' max' : '',
                img: CONFIG.YZUR.Icons.getLabel(roll.dice[0].type, roll.dice[0].total)
            }, {
                type: roll.dice[1].type, total: roll.dice[1].total,
                max: roll.dice[1].total === 6 ? ' max' : '',
                img: CONFIG.YZUR.Icons.getLabel(roll.dice[1].type, roll.dice[1].total)
            }]
        });
        let speaker = ChatMessage.getSpeaker({ token: 'actor' });

        ChatMessage.create({
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            rolls: [roll],
            speaker: speaker,
            flags: {
                [FBLSoloGame.ID]: {
                    html: game.i18n.format(`${FBLSoloGame.ID}.roll.dice.html`, {
                        alias: speaker.alias,
                        total: roll.total,
                        name: game.i18n.localize(`${FBLSoloGame.ID}.roll.dice.d66`)
                    })
                }
            }
        });
    };

    /**
     * Determine the weather of the day
     * 
     * Call in macro with type script:
     * 
     * e.g. Book of Beasts:
     * game.fblsologame.rollWeather('EFidMfBIS6BXr9Oh', 'iyLVAG4yumSp0wkW', 'ij31BhelKyxRm65H');
     * game.fblsologame.rollWeather('Wind', 'Rainfall', 'Temperature');
     * 
     * e.g. Bitter Reach:
     * game.fblsologame.rollWeather('FCfEt5Z1CAsp1GrR', 'Y9MNuBSiw1xknCaN', 'wWXv02TQ8qyk8cge');
     * game.fblsologame.rollWeather('BR - Wind', 'BR - Snow', 'BR - Cold');
     * 
     * @param {string} wind - the Rollable Table ID or Name
     * @param {string} rainfall - the Rollable Table ID or Name
     * @param {string} temperature - the Rollable Table ID or Name
     */
    static async #rollWeather(wind, rainfall, temperature) {
        FBLSoloGame.log(FBLSoloGame.#DEBUG, 'rollWeather', wind, rainfall, temperature);

        let rWind = await (game.tables.get(wind) ?? game.tables.getName(wind))?.roll() ?? null;
        if (!rWind) return ui.notifications.error(game.i18n.format(`${FBLSoloGame.ID}.macro.rolltable.error`, { idOrName: wind }), { permanent: true });

        let rRain = await (game.tables.get(rainfall) ?? game.tables.getName(rainfall))?.roll() ?? null;
        if (!rRain) return ui.notifications.error(game.i18n.format(`${FBLSoloGame.ID}.macro.rolltable.error`, { idOrName: rainfall }), { permanent: true });

        let rTemp = await (game.tables.get(temperature) ?? game.tables.getName(temperature))?.roll() ?? null;
        if (!rTemp) return ui.notifications.error(game.i18n.format(`${FBLSoloGame.ID}.macro.rolltable.error`, { idOrName: temperature }), { permanent: true });

        let template = `modules/${FBLSoloGame.ID}/templates/rollWeather.hbs`;
        let content = await renderTemplate(template, {
            roll: true, rWind, rRain, rTemp,
            weather: game.i18n.localize(`${FBLSoloGame.ID}.roll.weather.weather`)
        });
        let speaker = ChatMessage.getSpeaker({ token: 'actor' });
        let html = await renderTemplate(template, {
            roll: false, rWind, rRain, rTemp,
            weather: game.i18n.localize(`${FBLSoloGame.ID}.roll.weather.weather`).toUpperCase(),
            effect: game.i18n.localize(`${FBLSoloGame.ID}.roll.weather.effect`).toUpperCase()
        });

        ChatMessage.create({
            flavor: game.i18n.localize(`${FBLSoloGame.ID}.roll.weather.flavor`),
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            rolls: [rWind.roll, rRain.roll, rTemp.roll],
            speaker: speaker,
            flags: {
                [FBLSoloGame.ID]: { html: html }
            }
        });
    };

    /**
     * Roll Location Dialog
     * 
     * Whenever the adventurers reach a new hexagon on the map,
     * you can roll on the tables below to get a feel for the area.
     * Each terrain type has a separate table.
     * 
     * Call in macro with type script:
     * game.fblsologame.rollLocation();
     */
    static async #rollLocation() {
        FBLSoloGame.log(FBLSoloGame.#DEBUG, 'rollLocation');

        let options = FBLSoloGame.#TRE.filter(tre => { if (tre[Object.keys(tre)[0]].scenes.includes('vDd045IzUqVlE6a3')) return tre; }).map(tre => ({
            option: game.i18n.localize(game.fbl.config.i18n[Object.keys(tre)[0]]),
            value: tre[Object.keys(tre)[0]].locations
        }));

        if (!options.length) {
            ui.notifications.notify(game.i18n.localize(`${FBLSoloGame.ID}.dialog.rollLocation.error`));
            return;
        }

        let template = `modules/${FBLSoloGame.ID}/templates/selectDialog.hbs`
        let content = await renderTemplate(template, {
            label: game.i18n.localize(`${FBLSoloGame.ID}.dialog.rollLocation.label`),
            name: 'terrain',
            options: options
        });

        await Dialog.prompt({
            title: game.i18n.localize(`${FBLSoloGame.ID}.dialog.rollLocation.title`),
            content: content,
            label: game.i18n.localize(`${FBLSoloGame.ID}.dialog.rollLocation.button`),
            callback: async (html) => {
                let terrain = html.find('[name="terrain"]').val().split(',');
                let tableID = (terrain[Math.floor(Math.random() * terrain.length)]).trim();

                let table = await game.tables.get(tableID);
                let displayRoll = await table.displayRoll;

                table.displayRoll = false;
                await table.draw();
                table.displayRoll = displayRoll;
            },
            options: {
                width: 280
            }
        });
    }

    /**
     * Draw Yes/No Oracle
     * 
     * Rule number 1 is to go with your gut!
     * ✥ If you’re not sure of the odds or they’re 50/50, only draw one card.
     * ✥ If the odds are Likely, draw two cards and take the most positive result (high red > low black).
     * ✥ If the odds are Unlikely, draw two cards and take the most negative result (high black > low red).
     * 
     * Call in macro with type script:
     * game.fblsologame.drawYesNoOracle('EMKoC3FVpxldg14s', 'Vi345ij1kll8VlCe');
     * game.fblsologame.drawYesNoOracle('Oracle Deck', 'Oracle Hand');
     * 
     * @param {string} deck - the Card Stacks Deck ID or Name
     * @param {string} discardPile - the Card Stacks Discard Pile ID or Name
     */
    static async #drawYesNoOracle(deck, discardPile) {
        FBLSoloGame.log(FBLSoloGame.#DEBUG, 'drawYesNoOracle', deck, discardPile);

        let template = `modules/${FBLSoloGame.ID}/templates/selectDialog.hbs`
        let content = await renderTemplate(template, {
            label: game.i18n.localize(`${FBLSoloGame.ID}.dialog.yesNoOracle.label`),
            name: 'odds',
            options: [{
                option: game.i18n.localize(`${FBLSoloGame.ID}.dialog.yesNoOracle.option.1`),
                value: 1
            }, {
                option: game.i18n.localize(`${FBLSoloGame.ID}.dialog.yesNoOracle.option.2`),
                value: 2
            }, {
                option: game.i18n.localize(`${FBLSoloGame.ID}.dialog.yesNoOracle.option.3`),
                value: 3
            }]
        });

        let odds = await Dialog.prompt({
            title: game.i18n.localize(`${FBLSoloGame.ID}.dialog.yesNoOracle.title`),
            content: content,
            label: game.i18n.localize(`${FBLSoloGame.ID}.dialog.yesNoOracle.button`),
            callback: async (html) => {
                return html.find('[name="odds"]').val();
            }
        });

        let sound = `modules/${FBLSoloGame.ID}/assets/sounds/dropOneCard.mp3`;
        let cards = await FBLSoloGame.#drawCard(deck, discardPile, (odds > 1 ? 2 : 1));
        if (Number.isInteger(cards)) return;

        let suit = new Map([['hearts', 39], ['diamonds', 26], ['spades', 13], ['clubs', 0]]);

        if (odds > 1) {
            let one = suit.get(cards[0].suit) + (cards[0].value == 1 ? 14 : cards[0].value);
            let two = suit.get(cards[1].suit) + (cards[1].value == 1 ? 14 : cards[1].value);

            cards = (odds == 2) ? (one > two ? [cards[0], cards[1]] : [cards[1], cards[0]]) : (one < two ? [cards[0], cards[1]] : [cards[1], cards[0]]);
            sound = `modules/${FBLSoloGame.ID}/assets/sounds/dropTwoCards.mp3`;
        }

        let yesno = cards[0].color === 'black' ? game.i18n.localize(`${FBLSoloGame.ID}.draw.yesNoOracle.answer.no`) : game.i18n.localize(`${FBLSoloGame.ID}.draw.yesNoOracle.answer.yes`);
        let yesnoext = cards[0].color === 'black' ? game.i18n.localize(`${FBLSoloGame.ID}.draw.yesNoOracle.answer.noext`) : game.i18n.localize(`${FBLSoloGame.ID}.draw.yesNoOracle.answer.yesext`);
        let message = game.i18n.localize(`${FBLSoloGame.ID}.draw.yesNoOracle.answer.1`); // card[0].value is 2 or 3

        if (cards[0].value == 1) message = game.i18n.format(`${FBLSoloGame.ID}.draw.yesNoOracle.answer.2`, { yesno: yesno });
        if (cards[0].value >= 4 && cards[0].value <= 10) message = game.i18n.format(`${FBLSoloGame.ID}.draw.yesNoOracle.answer.3`, { yesno: yesno });
        if (cards[0].value >= 11 && cards[0].value <= 13) message = game.i18n.format(`${FBLSoloGame.ID}.draw.yesNoOracle.answer.4`, { yesnoext: yesnoext });

        template = `modules/${FBLSoloGame.ID}/templates/drawCard.hbs`;
        content = await renderTemplate(template, { cards, message });
        let speaker = ChatMessage.getSpeaker({ token: 'actor' });
        let oracleType = game.i18n.localize(`${FBLSoloGame.ID}.draw.yesNoOracle.type`);

        ChatMessage.create({
            flavor: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.flavor`, { type: oracleType }),
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            speaker: speaker,
            sound: sound,
            flags: {
                [FBLSoloGame.ID]: {
                    html: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.html`, {
                        alias: speaker.alias,
                        type: oracleType,
                        card: cards[0].short,
                        result: message
                    })
                }
            }
        });
    }

    /**
     * Draw Helpful/Hazardous Oracle
     * 
     * In many situations, you may wish to know how hazardous or hostile an encounter is.
     * This can also be used for NPCs and villages. In that case, roll for your Reputation first
     * and use the oracle below if you are not known, to find out how people react to you.
     * 
     * Call in macro with type script:
     * game.fblsologame.drawHelpfulHazardousOracle('EMKoC3FVpxldg14s', 'Vi345ij1kll8VlCe');
     * game.fblsologame.drawHelpfulHazardousOracle('Oracle Deck', 'Oracle Hand');
     * 
     * @param {string} deck - the Card Stacks Deck ID or Name
     * @param {string} discardPile - the Card Stacks Discard Pile ID or Name
     */
    static async #drawHelpfulHazardousOracle(deck, discardPile) {
        FBLSoloGame.log(FBLSoloGame.#DEBUG, 'drawHelpfulHazardousOracle', deck, discardPile);

        let cards = await FBLSoloGame.#drawCard(deck, discardPile, 1);
        if (Number.isInteger(cards)) return;

        let message = game.i18n.localize(`${FBLSoloGame.ID}.draw.helpfulHazardousOracle.neutral`); // card[0].value is 2 to 4

        if (cards[0].value >= 5 && cards[0].value <= 7) message = cards[0].color === 'red' ?
            game.i18n.localize(`${FBLSoloGame.ID}.draw.helpfulHazardousOracle.mildlyhelpful`) :
            game.i18n.localize(`${FBLSoloGame.ID}.draw.helpfulHazardousOracle.mildlydangerous`);

        if (cards[0].value >= 8 && cards[0].value <= 10) message = cards[0].color === 'red' ?
            game.i18n.localize(`${FBLSoloGame.ID}.draw.helpfulHazardousOracle.helpful`) :
            game.i18n.localize(`${FBLSoloGame.ID}.draw.helpfulHazardousOracle.dangerous`);

        if (cards[0].value >= 11 && cards[0].value <= 12) message = cards[0].color === 'red' ?
            game.i18n.localize(`${FBLSoloGame.ID}.draw.helpfulHazardousOracle.veryhelpful`) :
            game.i18n.localize(`${FBLSoloGame.ID}.draw.helpfulHazardousOracle.verydangerous`);

        if (cards[0].value == 13 || cards[0].value == 1) message = cards[0].color === 'red' ?
            game.i18n.localize(`${FBLSoloGame.ID}.draw.helpfulHazardousOracle.lifesaving`) :
            game.i18n.localize(`${FBLSoloGame.ID}.draw.helpfulHazardousOracle.deadly`);

        let template = `modules/${FBLSoloGame.ID}/templates/drawCard.hbs`;
        let content = await renderTemplate(template, { cards, message });
        let speaker = ChatMessage.getSpeaker({ token: 'actor' });
        let oracleType = game.i18n.localize(`${FBLSoloGame.ID}.draw.helpfulHazardousOracle.type`);

        ChatMessage.create({
            flavor: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.flavor`, { type: oracleType }),
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            sound: `modules/${FBLSoloGame.ID}/assets/sounds/dropOneCard.mp3`,
            speaker: speaker,
            flags: {
                [FBLSoloGame.ID]: {
                    html: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.html`, {
                        alias: speaker.alias,
                        type: oracleType,
                        card: cards[0].short,
                        result: message
                    })
                }
            }
        });
    }

    /**
     * Draw Theme Oracle
     * 
     * At times you may wonder at a situation you find yourself in – perhaps a general
     * encounter doesn’t make much sense at first, you need some more information from
     * an NPC, or you need help with some other idea. Whenever you are stuck in such a way,
     * draw a card, and consult the table below. If the meaning is not clear, draw a second
     * card and treat one as a minor theme.
     * 
     * Call in macro with type script:
     * game.fblsologame.drawThemeOracle('EMKoC3FVpxldg14s', 'Vi345ij1kll8VlCe');
     * game.fblsologame.drawThemeOracle('Oracle Deck', 'Oracle Hand');
     * 
     * @param {string} deck - the Card Stacks Deck ID or Name
     * @param {string} discardPile - the Card Stacks Discard Pile ID or Name
     */
    static async #drawThemeOracle(deck, discardPile) {
        FBLSoloGame.log(FBLSoloGame.#DEBUG, 'drawThemeOracle', deck, discardPile);

        let cards = await FBLSoloGame.#drawCard(deck, discardPile, 1);
        if (Number.isInteger(cards)) return;

        let suit = new Map([['diamonds', 0], ['hearts', 13], ['clubs', 26], ['spades', 39]]);
        let themeno = suit.get(cards[0].suit) + cards[0].value;
        let theme = Object.keys(game.i18n.translations[FBLSoloGame.ID].draw.themeOracle.theme[themeno])[0];
        let message = game.i18n.localize(`${FBLSoloGame.ID}.draw.themeOracle.theme.${themeno}.${theme}`);

        let template = `modules/${FBLSoloGame.ID}/templates/drawCard.hbs`;
        let content = await renderTemplate(template, { cards, message });
        let speaker = ChatMessage.getSpeaker({ token: 'actor' });
        let oracleType = game.i18n.localize(`${FBLSoloGame.ID}.draw.themeOracle.type`);

        ChatMessage.create({
            flavor: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.flavor`, { type: oracleType }),
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            sound: `modules/${FBLSoloGame.ID}/assets/sounds/dropOneCard.mp3`,
            speaker: speaker,
            flags: {
                [FBLSoloGame.ID]: {
                    html: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.html`, {
                        alias: speaker.alias,
                        type: oracleType,
                        card: cards[0].short,
                        result: message
                    })
                }
            }
        });
    }

    /**
     * Draw Wilderness Oracle
     * 
     * The locations in the table below are intended to give a bit of flavor to the
     * hex you are traveling in. Perhaps you are wondering where you have made camp
     * for the night, or where exactly an encounter with some refugees takes place.
     * 
     * Call in macro with type script:
     * game.fblsologame.drawWildernessOracle('EMKoC3FVpxldg14s', 'Vi345ij1kll8VlCe');
     * game.fblsologame.drawWildernessOracle('Oracle Deck', 'Oracle Hand');
     * 
     * @param {string} deck - the Card Stacks Deck ID or Name
     * @param {string} discardPile - the Card Stacks Discard Pile ID or Name
     */
    static async #drawWildernessOracle(deck, discardPile) {
        FBLSoloGame.log(FBLSoloGame.#DEBUG, 'drawWildernessOracle', deck, discardPile);

        let template = `modules/${FBLSoloGame.ID}/templates/selectDialog.hbs`
        let content = await renderTemplate(template, {
            label: game.i18n.localize(`${FBLSoloGame.ID}.dialog.wildernessOracle.label`),
            name: 'hex',
            options: [{
                option: game.i18n.localize(`${FBLSoloGame.ID}.dialog.wildernessOracle.option.1`),
                value: 1
            }, {
                option: game.i18n.localize(`${FBLSoloGame.ID}.dialog.wildernessOracle.option.2`),
                value: 2
            }, {
                option: game.i18n.localize(`${FBLSoloGame.ID}.dialog.wildernessOracle.option.3`),
                value: 3
            }, {
                option: game.i18n.localize(`${FBLSoloGame.ID}.dialog.wildernessOracle.option.4`),
                value: 4
            }]
        });

        let hex = await Dialog.prompt({
            title: game.i18n.localize(`${FBLSoloGame.ID}.dialog.wildernessOracle.title`),
            content: content,
            label: game.i18n.localize(`${FBLSoloGame.ID}.dialog.wildernessOracle.button`),
            callback: async (html) => {
                return html.find('[name="hex"]').val();
            }
        });

        let cards = await FBLSoloGame.#drawCard(deck, discardPile, 1);
        if (Number.isInteger(cards)) return;

        let locations = [
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
            [14, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 15, 16],
            [17, 2, 3, 4, 5, 6, 7, 8, 9, 18, 19, 15, 16],
            [20, 2, 3, 4, 5, 6, 7, 8, 9, 21, 20, 22, 23]
        ];
        let locationno = locations[hex - 1][cards[0].value - 1];
        let location = Object.keys(game.i18n.translations[FBLSoloGame.ID].draw.wildernessOracle.location[locationno])[0];
        let message = game.i18n.localize(`${FBLSoloGame.ID}.draw.wildernessOracle.location.${locationno}.${location}`);

        template = `modules/${FBLSoloGame.ID}/templates/drawCard.hbs`;
        content = await renderTemplate(template, { cards, message });
        let speaker = ChatMessage.getSpeaker({ token: 'actor' });
        let oracleType = game.i18n.localize(`${FBLSoloGame.ID}.draw.wildernessOracle.type`);

        ChatMessage.create({
            flavor: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.flavor`, { type: oracleType }),
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            sound: `modules/${FBLSoloGame.ID}/assets/sounds/dropOneCard.mp3`,
            speaker: speaker,
            flags: {
                [FBLSoloGame.ID]: {
                    html: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.html`, {
                        alias: speaker.alias,
                        type: oracleType,
                        card: cards[0].short,
                        result: message
                    })
                }
            }
        });
    }

    /**
     * Draw Kin Oracle
     * 
     * Call in macro with type script:
     * game.fblsologame.drawKinOracle('EMKoC3FVpxldg14s', 'Vi345ij1kll8VlCe');
     * game.fblsologame.drawKinOracle('Oracle Deck', 'Oracle Hand');
     * 
     * @param {string} deck - the Card Stacks Deck ID or Name
     * @param {string} discardPile - the Card Stacks Discard Pile ID or Name
     */
    static async #drawKinOracle(deck, discardPile) {
        FBLSoloGame.log(FBLSoloGame.#DEBUG, 'drawKinOracle', deck, discardPile);

        let template = `modules/${FBLSoloGame.ID}/templates/selectDialog.hbs`
        let content = await renderTemplate(template, {
            label: game.i18n.localize(`${FBLSoloGame.ID}.dialog.kinOracle.label`),
            name: 'region',
            options: [{
                option: game.i18n.localize(`${FBLSoloGame.ID}.dialog.kinOracle.option.1`),
                value: 1
            }, {
                option: game.i18n.localize(`${FBLSoloGame.ID}.dialog.kinOracle.option.2`),
                value: 2
            }, {
                option: game.i18n.localize(`${FBLSoloGame.ID}.dialog.kinOracle.option.3`),
                value: 3
            }]
        });

        let region = await Dialog.prompt({
            title: game.i18n.localize(`${FBLSoloGame.ID}.dialog.kinOracle.title`),
            content: content,
            label: game.i18n.localize(`${FBLSoloGame.ID}.dialog.kinOracle.button`),
            callback: async (html) => {
                return html.find('[name="region"]').val();
            }
        });

        let cards = await FBLSoloGame.#drawCard(deck, discardPile, 1);
        if (Number.isInteger(cards)) return;

        let regions = [
            [1, 2, 2, 3, 3, 4, 4, 5, 6, 7, 8, 9, 10],
            [1, 4, 4, 4, 4, 2, 2, 8, 8, 8, 10, 10, 9],
            [9, 11, 11, 12, 12, 13, 13, 14, 15, 16, 17, 18, 10]
        ];
        let kinno = regions[region - 1][cards[0].value - 1];
        let kin = Object.keys(game.i18n.translations[FBLSoloGame.ID].draw.kinOracle.kin[kinno])[0];
        let message = game.i18n.localize(`${FBLSoloGame.ID}.draw.kinOracle.kin.${kinno}.${kin}`);

        template = `modules/${FBLSoloGame.ID}/templates/drawCard.hbs`;
        content = await renderTemplate(template, { cards, message });
        let speaker = ChatMessage.getSpeaker({ token: 'actor' });
        let oracleType = game.i18n.localize(`${FBLSoloGame.ID}.draw.kinOracle.type`);

        ChatMessage.create({
            flavor: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.flavor`, { type: oracleType }),
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            sound: `modules/${FBLSoloGame.ID}/assets/sounds/dropOneCard.mp3`,
            speaker: speaker,
            flags: {
                [FBLSoloGame.ID]: {
                    html: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.html`, {
                        alias: speaker.alias,
                        type: oracleType,
                        card: cards[0].short,
                        result: message
                    })
                }
            }
        });
    }

    /**
     * Draw Kin Name Oracle
     * 
     * Call in macro with type script:
     * game.fblsologame.drawKinNameOracle('EMKoC3FVpxldg14s', 'Vi345ij1kll8VlCe');
     * game.fblsologame.drawKinNameOracle('Oracle Deck', 'Oracle Hand');
     * 
     * @param {string} deck - the Card Stacks Deck ID or Name
     * @param {string} discardPile - the Card Stacks Discard Pile ID or Name
     */
    static async #drawKinNameOracle(deck, discardPile) {
        FBLSoloGame.log(FBLSoloGame.#DEBUG, 'drawKinNameOracle', deck, discardPile);

        let template = `modules/${FBLSoloGame.ID}/templates/selectDialog.hbs`
        let content = await renderTemplate(template, {
            label: game.i18n.localize(`${FBLSoloGame.ID}.dialog.kinNameOracle.label`),
            name: 'kin',
            options: [{
                option: game.i18n.localize(`${FBLSoloGame.ID}.dialog.kinNameOracle.option.1`),
                value: 1
            }, {
                option: game.i18n.localize(`${FBLSoloGame.ID}.dialog.kinNameOracle.option.2`),
                value: 3
            }, {
                option: game.i18n.localize(`${FBLSoloGame.ID}.dialog.kinNameOracle.option.3`),
                value: 5
            }, {
                option: game.i18n.localize(`${FBLSoloGame.ID}.dialog.kinNameOracle.option.4`),
                value: 7
            }, {
                option: game.i18n.localize(`${FBLSoloGame.ID}.dialog.kinNameOracle.option.5`),
                value: 9
            }, {
                option: game.i18n.localize(`${FBLSoloGame.ID}.dialog.kinNameOracle.option.6`),
                value: 11
            }, {
                option: game.i18n.localize(`${FBLSoloGame.ID}.dialog.kinNameOracle.option.7`),
                value: 13
            }, {
                option: game.i18n.localize(`${FBLSoloGame.ID}.dialog.kinNameOracle.option.8`),
                value: 15
            }]
        });

        let kin = await Dialog.prompt({
            title: game.i18n.localize(`${FBLSoloGame.ID}.dialog.kinNameOracle.title`),
            content: content,
            label: game.i18n.localize(`${FBLSoloGame.ID}.dialog.kinNameOracle.button`),
            callback: async (html) => {
                return html.find('[name="kin"]').val();
            }
        });

        let cards = await FBLSoloGame.#drawCard(deck, discardPile, 1);
        if (Number.isInteger(cards)) return;

        let kinNames = await fetchJsonWithTimeout(`modules/${FBLSoloGame.ID}/assets/kinNames.json`);
        let message = `${kinNames[cards[0].color === 'red' ?
            kin - 1 : kin][cards[0].value === 1 ? 12 : cards[0].value - 2]} (${cards[0].color === 'red' ?
                game.i18n.localize(`${FBLSoloGame.ID}.draw.kinNameOracle.female`) : game.i18n.localize(`${FBLSoloGame.ID}.draw.kinNameOracle.male`)})`;

        template = `modules/${FBLSoloGame.ID}/templates/drawCard.hbs`;
        content = await renderTemplate(template, { cards, message });
        let speaker = ChatMessage.getSpeaker({ token: 'actor' });
        let oracleType = game.i18n.localize(`${FBLSoloGame.ID}.draw.kinNameOracle.type`);

        ChatMessage.create({
            flavor: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.flavor`, { type: oracleType }),
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            sound: `modules/${FBLSoloGame.ID}/assets/sounds/dropOneCard.mp3`,
            speaker: speaker,
            flags: {
                [FBLSoloGame.ID]: {
                    html: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.html`, {
                        alias: speaker.alias,
                        type: oracleType,
                        card: cards[0].short,
                        result: message
                    })
                }
            }
        });
    }

    /**
     * Draw Traits Oracle
     * 
     * Use this table to help determine an NPC’s outlook and motivations. It can also be
     * used to determine the outlook for a community – use the Diamond column for the red
     * suits and the Clubs column for the black suits and consult the relevant gray column.
     * 
     * Call in macro with type script:
     * game.fblsologame.drawTraitsOracle('EMKoC3FVpxldg14s', 'Vi345ij1kll8VlCe');
     * game.fblsologame.drawTraitsOracle('Oracle Deck', 'Oracle Hand');
     * 
     * @param {string} deck - the Card Stacks Deck ID or Name
     * @param {string} discardPile - the Card Stacks Discard Pile ID or Name
     */
    static async #drawTraitsOracle(deck, discardPile) {
        FBLSoloGame.log(FBLSoloGame.#DEBUG, 'drawTraitsOracle', deck, discardPile);

        let template = `modules/${FBLSoloGame.ID}/templates/selectDialog.hbs`
        let content = await renderTemplate(template, {
            label: game.i18n.localize(`${FBLSoloGame.ID}.dialog.traitsOracle.label`),
            name: 'type',
            options: [{
                option: game.i18n.localize(`${FBLSoloGame.ID}.dialog.traitsOracle.option.1`),
                value: 1
            }, {
                option: game.i18n.localize(`${FBLSoloGame.ID}.dialog.traitsOracle.option.2`),
                value: 2
            }]
        });

        let type = await Dialog.prompt({
            title: game.i18n.localize(`${FBLSoloGame.ID}.dialog.traitsOracle.title`),
            content: content,
            label: game.i18n.localize(`${FBLSoloGame.ID}.dialog.traitsOracle.button`),
            callback: async (html) => {
                return html.find('[name="type"]').val();
            }
        });

        let cards = await FBLSoloGame.#drawCard(deck, discardPile, 1);
        if (Number.isInteger(cards)) return;

        let suitTypeOne = new Map([['diamonds', 0], ['hearts', 13], ['clubs', 26], ['spades', 39]]);
        let suitTypeTwo = new Map([['diamonds', 0], ['hearts', 0], ['clubs', 26], ['spades', 26]]);
        let traitno = (type == 1 ? suitTypeOne.get(cards[0].suit) : suitTypeTwo.get(cards[0].suit)) + (cards[0].value);
        let trait = Object.keys(game.i18n.translations[FBLSoloGame.ID].draw.traitsOracle.trait[traitno])[0];
        let message = game.i18n.localize(`${FBLSoloGame.ID}.draw.traitsOracle.trait.${traitno}.${trait}`);

        template = `modules/${FBLSoloGame.ID}/templates/drawCard.hbs`;
        content = await renderTemplate(template, { cards, message });
        let speaker = ChatMessage.getSpeaker({ token: 'actor' });
        let oracleType = game.i18n.localize(`${FBLSoloGame.ID}.draw.traitsOracle.type`);

        ChatMessage.create({
            flavor: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.flavor`, { type: oracleType }),
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            sound: `modules/${FBLSoloGame.ID}/assets/sounds/dropOneCard.mp3`,
            speaker: speaker,
            flags: {
                [FBLSoloGame.ID]: {
                    html: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.html`, {
                        alias: speaker.alias,
                        type: oracleType,
                        card: cards[0].short,
                        result: message
                    })
                }
            }
        });
    }

    /**
     * Draw Loot
     * 
     * Call in macro with type script:
     * game.fblsologame.drawLoot('EMKoC3FVpxldg14s', 'Vi345ij1kll8VlCe');
     * game.fblsologame.drawLoot('Oracle Deck', 'Oracle Hand');
     * 
     * @param {string} deck - the Card Stacks Deck ID or Name
     * @param {string} discardPile - the Card Stacks Discard Pile ID or Name
     */
    static async #drawLoot(deck, discardPile) {
        FBLSoloGame.log(FBLSoloGame.#DEBUG, 'drawLoot', deck, discardPile);

        let cards = await FBLSoloGame.#drawCard(deck, discardPile, 1);
        if (Number.isInteger(cards)) return;

        let loots = [
            [1, 2, 3, 4, 5],
            [6, 2, 3, 4, 5],
            [7, 2, 3, 4, 5],
            [7, 2, 3, 4, 5]
        ];

        let suit = new Map([['diamonds', 0], ['hearts', 1], ['clubs', 2], ['spades', 3]]);
        let face = 0; // cards[0].value = 1
        if (cards[0].value >= 2 && cards[0].value <= 10) face = 1;
        if (cards[0].value == 11) face = 2;
        if (cards[0].value == 12) face = 3;
        if (cards[0].value == 13) face = 4;

        let lootno = loots[suit.get(cards[0].suit)][face];
        let loot = Object.keys(game.i18n.translations[FBLSoloGame.ID].draw.loot.type[lootno])[0];
        let message = game.i18n.localize(`${FBLSoloGame.ID}.draw.loot.type.${lootno}.${loot}`);

        let template = `modules/${FBLSoloGame.ID}/templates/drawCard.hbs`;
        let content = await renderTemplate(template, { cards, message });
        let speaker = ChatMessage.getSpeaker({ token: 'actor' });
        let lootName = game.i18n.localize(`${FBLSoloGame.ID}.draw.loot.name`);

        ChatMessage.create({
            flavor: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.flavor`, { type: lootName }),
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            sound: `modules/${FBLSoloGame.ID}/assets/sounds/dropOneCard.mp3`,
            speaker: speaker,
            flags: {
                [FBLSoloGame.ID]: {
                    html: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.html`, {
                        alias: speaker.alias,
                        type: lootName,
                        card: cards[0].short,
                        result: message
                    })
                }
            }
        });
    }

    /**
     * Draw Encounter Type
     * 
     * Call in macro with type script:
     * game.fblsologame.drawEncouterType('EMKoC3FVpxldg14s', 'Vi345ij1kll8VlCe');
     * game.fblsologame.drawEncouterType('Oracle Deck', 'Oracle Hand');
     * 
     * @param {string} deck - the Card Stacks Deck ID or Name
     * @param {string} discardPile - the Card Stacks Discard Pile ID or Name
     */
    static async #drawEncouterType(deck, discardPile) {
        FBLSoloGame.log(FBLSoloGame.#DEBUG, 'drawEncouterType', deck, discardPile);

        let cards = await FBLSoloGame.#drawCard(deck, discardPile, 1);
        if (Number.isInteger(cards)) return;

        let type = game.i18n.localize(`${FBLSoloGame.ID}.draw.encounterType.randomAdventureSite`); // cards[0].value is 1
        let message = `@FBL[Roll.DcJzSAeVKpH6WAOh]{${type}}`;

        if (cards[0].value >= 2 && cards[0].value <= 10) {
            type = game.i18n.localize(`${FBLSoloGame.ID}.draw.encounterType.randomEncounter`);
            message = `@FBL[Macro.YH3fD6wWY1P2KfIO]{${type}}`;
        }

        if (cards[0].value >= 11 && cards[0].value <= 13) {
            type = game.i18n.localize(`${FBLSoloGame.ID}.draw.encounterType.generalEncounter`);
            message = `@FBL[Draw.dYpVcGPvp8Z80CNE]{${type}}`;
        }

        let template = `modules/${FBLSoloGame.ID}/templates/drawCard.hbs`;
        let content = await renderTemplate(template, { cards, message });
        let speaker = ChatMessage.getSpeaker({ token: 'actor' });
        let encounterName = game.i18n.localize(`${FBLSoloGame.ID}.draw.encounterType.name`);

        ChatMessage.create({
            flavor: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.flavor`, { type: encounterName }),
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            sound: `modules/${FBLSoloGame.ID}/assets/sounds/dropOneCard.mp3`,
            speaker: speaker,
            flags: {
                [FBLSoloGame.ID]: {
                    html: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.html`, {
                        alias: speaker.alias,
                        type: encounterName,
                        card: cards[0].short,
                        result: message
                    })
                }
            }
        });
    }

    /**
     * Draw General Encounter
     * 
     * Call in macro with type script:
     * game.fblsologame.drawGeneralEncouter('EMKoC3FVpxldg14s', 'Vi345ij1kll8VlCe', '6yXXJoifP6qBcELp');
     * game.fblsologame.drawGeneralEncouter('Oracle Deck', 'Oracle Hand', 'General Encounters - Solo Game');
     * 
     * @param {string} deck - the Card Stacks Deck ID or Name
     * @param {string} discardPile - the Card Stacks Discard Pile ID or Name
     * @param {string} generalEncounters - the Rollable Table ID or Name
     */
    static async #drawGeneralEncouter(deck, discardPile, generalEncounters) {
        FBLSoloGame.log(FBLSoloGame.#DEBUG, 'drawGeneralEncouter', deck, discardPile);

        let table = game.tables.get(generalEncounters) ?? game.tables.getName(generalEncounters);
        if (!table) return ui.notifications.error(game.i18n.format(`${FBLSoloGame.ID}.macro.rolltable.error`, { idOrName: generalEncounters }), { permanent: true });

        let cards = await FBLSoloGame.#drawCard(deck, discardPile, 1);
        if (Number.isInteger(cards)) return;

        let message = table.getResultsForRoll(cards[0].value)[0].text;
        let template = `modules/${FBLSoloGame.ID}/templates/drawCard.hbs`;
        let content = await renderTemplate(template, { cards, message });
        let speaker = ChatMessage.getSpeaker({ token: 'actor' });
        let encounterName = game.i18n.localize(`${FBLSoloGame.ID}.draw.generalEncounter.name`);

        ChatMessage.create({
            flavor: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.flavor`, { type: encounterName }),
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            sound: `modules/${FBLSoloGame.ID}/assets/sounds/dropOneCard.mp3`,
            speaker: speaker,
            flags: {
                [FBLSoloGame.ID]: {
                    html: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.html`, {
                        alias: speaker.alias,
                        type: encounterName,
                        card: cards[0].short,
                        result: message
                    })
                }
            }
        });
    }

    /**
     * Generate Adventure Site Dialog
     * 
     * Call in macro with type script:
     * 
     * e.g. Castle:
     * game.fblsologame.generateAdventureSite('Castle');
     * 
     * e.g. Dungeon:
     * game.fblsologame.generateAdventureSite('Dungeon');
     * 
     * e.g. Village:
     * game.fblsologame.generateAdventureSite('Village');
     * 
     * @param {string} type - the type of the adventure site ('Castle', 'Dungeon' or 'Village')
     */
    static async #generateAdventureSite(type) {
        FBLSoloGame.log(FBLSoloGame.#DEBUG, 'generateAdventureSite', type);

        if (![
            game.i18n.localize(`${FBLSoloGame.ID}.macro.generateAdventureSite.castle`),
            game.i18n.localize(`${FBLSoloGame.ID}.macro.generateAdventureSite.dungeon`),
            game.i18n.localize(`${FBLSoloGame.ID}.macro.generateAdventureSite.village`)
        ].includes(type)) return ui.notifications.error(game.i18n.format(`${FBLSoloGame.ID}.macro.generateAdventureSite.error`, { type: type }), { permanent: true });

        await CONFIG.JournalEntry.documentClass.createDialog({
            name: game.i18n.format(`${FBLSoloGame.ID}.dialog.generateAdventureSite.placeholder`, { type: type }),
            folder: '5eGiW1CRblvQgNO5',
            type: type.toLowerCase()
        }, {
            flags: {
                [FBLSoloGame.ID]: {
                    type: 'generateAdventureSite',
                    name: game.i18n.format(`${FBLSoloGame.ID}.dialog.generateAdventureSite.name`, { type: type })
                }
            }
        });
    }

    /**
     * Select Random Encounter Dialog
     * 
     * Call in macro with type script:
     * game.fblsologame.selectRandomEncounter();
     */
    static async #selectRandomEncounter() {
        FBLSoloGame.log(FBLSoloGame.#DEBUG, 'selectRandomEncounter');

        let options = FBLSoloGame.#TRE.filter(tre => { if (tre[Object.keys(tre)[0]].scenes.includes(game.scenes.current.id)) return tre; }).map(tre => ({
            option: game.i18n.localize(game.fbl.config.i18n[Object.keys(tre)[0]]),
            value: game.settings.get(FBLSoloGame.ID, Object.keys(tre)[0])
        }));

        if (!options.length) {
            ui.notifications.notify(game.i18n.localize(`${FBLSoloGame.ID}.dialog.randomEncounters.error`));
            return;
        }

        let template = `modules/${FBLSoloGame.ID}/templates/selectDialog.hbs`
        let content = await renderTemplate(template, {
            label: game.i18n.localize(`${FBLSoloGame.ID}.dialog.randomEncounters.label`),
            name: 'terrain',
            options: options
        });

        await Dialog.prompt({
            title: game.i18n.localize(`${FBLSoloGame.ID}.dialog.randomEncounters.title`),
            content: content,
            label: game.i18n.localize(`${FBLSoloGame.ID}.dialog.randomEncounters.button`),
            callback: async (html) => {
                let terrain = html.find('[name="terrain"]').val().split(',');
                let table = (terrain[Math.floor(Math.random() * terrain.length)]).trim();

                await (game.tables.get(table) ?? game.tables.getName(table)).draw();
            },
            options: {
                width: 280
            }
        });
    }

    /**
     * Draw Motivations
     */
    static async #drawMotivations() {
        FBLSoloGame.log(FBLSoloGame.#DEBUG, 'drawMotivations');

        let table = game.tables.get('uwCZnA6E6a0tYkOw');
        if (!table) return ui.notifications.error(game.i18n.format(`${FBLSoloGame.ID}.macro.rolltable.error`, { idOrName: 'Motivations (uwCZnA6E6a0tYkOw)' }), { permanent: true });

        let cards = await FBLSoloGame.#drawCard('EMKoC3FVpxldg14s', 'Vi345ij1kll8VlCe', 1);
        if (Number.isInteger(cards)) return;

        let message = table.getResultsForRoll(cards[0].value)[0].text;
        let template = `modules/${FBLSoloGame.ID}/templates/drawCard.hbs`;
        let content = await renderTemplate(template, { cards, message });
        let speaker = ChatMessage.getSpeaker({ token: 'actor' });
        let encounterName = table.name;

        ChatMessage.create({
            flavor: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.flavor`, { type: encounterName }),
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            sound: `modules/${FBLSoloGame.ID}/assets/sounds/dropOneCard.mp3`,
            speaker: speaker,
            flags: {
                [FBLSoloGame.ID]: {
                    html: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.html`, {
                        alias: speaker.alias,
                        type: encounterName,
                        card: cards[0].short,
                        result: message
                    })
                }
            }
        });
    }

    /**
     * Draw Talents
     */
    static async #drawTalents() {
        FBLSoloGame.log(FBLSoloGame.#DEBUG, 'drawTalents');

        let table = game.tables.get('u5RoqLdDxiSUvrnV');
        if (!table) return ui.notifications.error(game.i18n.format(`${FBLSoloGame.ID}.macro.rolltable.error`, { idOrName: 'Talents (u5RoqLdDxiSUvrnV)' }), { permanent: true });

        let cards = await FBLSoloGame.#drawCard('EMKoC3FVpxldg14s', 'Vi345ij1kll8VlCe', 1);
        if (Number.isInteger(cards)) return;

        let message = table.getResultsForRoll(cards[0].value)[0].text;
        let template = `modules/${FBLSoloGame.ID}/templates/drawCard.hbs`;
        let content = await renderTemplate(template, { cards, message });
        let speaker = ChatMessage.getSpeaker({ token: 'actor' });
        let encounterName = table.name;

        ChatMessage.create({
            flavor: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.flavor`, { type: encounterName }),
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            sound: `modules/${FBLSoloGame.ID}/assets/sounds/dropOneCard.mp3`,
            speaker: speaker,
            flags: {
                [FBLSoloGame.ID]: {
                    html: game.i18n.format(`${FBLSoloGame.ID}.draw.anyCardStack.html`, {
                        alias: speaker.alias,
                        type: encounterName,
                        card: cards[0].short,
                        result: message
                    })
                }
            }
        });
    }

    /* COPY AND INSERT */

    /**
     * Context Menu Chat Log to copy message date as HTML
     * Called from Foundry VTT hook 'getChatLogEntryContext'
     * 
     * @param {jQuery} header - the message header data
     */
    static async #copyDate(header) {
        this.log(this.#DEBUG, 'copyDate', header);

        let message = game.messages.get(header.data("messageId"));
        let date = this.#getDate(message);
        let template = `modules/${this.ID}/templates/copyChat.hbs`;
        let content = await renderTemplate(template, { type: 'date', date });

        this.#setClipboard({
            type: game.i18n.localize(`${this.ID}.message.copy.date`),
            html: content.trim()
        });
    };

    /**
     * Context Menu Chat Log to copy message quater as HTML
     * Called from Foundry VTT hook 'getChatLogEntryContext'
     * 
     * @param {jQuery} header - the message header data
     */
    static async #copyQuater(header) {
        this.log(this.#DEBUG, 'copyQuater', header);

        let message = game.messages.get(header.data("messageId"));
        let date = this.#getDate(message);
        let template = `modules/${this.ID}/templates/copyChat.hbs`;
        let content = await renderTemplate(template, { type: 'quater', date });

        this.#setClipboard({
            type: game.i18n.localize(`${this.ID}.message.copy.quater`),
            html: content.trim()
        });
    };

    /**
     * Context Menu Chat Log to copy message content as HTML
     * Called from Foundry VTT hook 'getChatLogEntryContext'
     * 
     * @param {jQuery} header - the message header data
     */
    static async #copyMessage(header) {
        this.log(this.#DEBUG, 'copyMessage', header);

        let message = game.messages.get(header.data("messageId"));
        await this.#setFlags(message);

        if (message.flags[this.ID]) {
            let template = `modules/${this.ID}/templates/insertJournal.hbs`;
            let content = await renderTemplate(template, { type: 'message', message: message.flags[this.ID].html });

            this.#setClipboard({
                type: game.i18n.localize(`${this.ID}.message.copy.message`),
                html: content.trim()
            });
        } else {
            ui.notifications.error(game.i18n.format(`${this.ID}.message.copy.not-defined`, { id: message.id }), { permanent: true });
        };
    };

    /**
     * Context Menu Chat Log to insert message date in Journal
     * Called from Foundry VTT hook 'getChatLogEntryContext'
     * 
     * @param {jQuery} header - the message header data
     */
    static async #insertDate(header) {
        this.log(this.#DEBUG, 'insertDate', header);

        let message = game.messages.get(header.data("messageId"));
        let date = this.#getDate(message);
        let template = `modules/${this.ID}/templates/insertJournal.hbs`;
        let content = await renderTemplate(template, { type: 'date', date });

        this.#setJournal({
            type: game.i18n.localize(`${this.ID}.message.copy.date`),
            html: content.trim()
        });
    };

    /**
     * Context Menu Chat Log to insert message quater in Journal
     * Called from Foundry VTT hook 'getChatLogEntryContext'
     * 
     * @param {jQuery} header - the message header data
     */
    static async #insertQuater(header) {
        this.log(this.#DEBUG, 'insertQuater', header);

        let message = game.messages.get(header.data("messageId"));
        let date = this.#getDate(message);
        let template = `modules/${this.ID}/templates/insertJournal.hbs`;
        let content = await renderTemplate(template, { type: 'quater', date });

        this.#setJournal({
            type: game.i18n.localize(`${this.ID}.message.copy.quater`),
            html: content.trim()
        });
    };

    /**
     * Context Menu Chat Log to insert message content in Journal
     * Called from Foundry VTT hook 'getChatLogEntryContext'
     * 
     * @param {jQuery} header - the message header data
     */
    static async #insertMessage(header) {
        this.log(this.#DEBUG, 'insertMessage', header);

        let message = game.messages.get(header.data("messageId"));
        await this.#setFlags(message);

        if (message.flags[this.ID]) {
            let template = `modules/${this.ID}/templates/insertJournal.hbs`;
            let content = await renderTemplate(template, { type: 'message', message: message.flags[this.ID].html });

            this.#setJournal({
                type: game.i18n.localize(`${this.ID}.message.copy.message`),
                html: content.trim()
            });
        } else {
            ui.notifications.error(game.i18n.format(`${this.ID}.message.insert.not-defined`, { id: message.id }), { permanent: true });
        };
    };

    /* HELPER */

    /**
     * Get date from message
     * 
     * @param {jQuery} message - the message data
     * 
     * @typedef {Object} MessageDate
     * @property {string} date - the message date as string
     * @property {string} quater - the message quater as string
     * @property {string} light - the message light as string
     * @property {string} short - the message shortdate as string
     * 
     * @returns {MessageDate} the message date object
     */
    static #getDate(message) {
        this.log(this.#DEBUG, 'getDate', message);

        let now = new Date(message.timestamp);
        let hour = now.getHours();
        let seasons = [
            { name: 'spring', date: new Date(now.getFullYear(), 2, (now.getFullYear() % 4 === 0) ? 19 : 20).getTime() },
            { name: 'summer', date: new Date(now.getFullYear(), 5, (now.getFullYear() % 4 === 0) ? 20 : 21).getTime() },
            { name: 'autumn', date: new Date(now.getFullYear(), 8, (now.getFullYear() % 4 === 0) ? 22 : 23).getTime() },
            { name: 'winter', date: new Date(now.getFullYear(), 11, (now.getFullYear() % 4 === 0) ? 20 : 21).getTime() }
        ];
        let season = (seasons.filter(({ date }) => date <= now).slice(-1)[0] || { name: 'winter' }).name;
        let date = now.toLocaleDateString(game.i18n.lang, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        let short = now.toLocaleDateString(game.i18n.lang, { weekday: 'short', year: '2-digit', month: 'short', day: 'numeric' });

        if (game.modules.get('foundryvtt-simple-calendar')?.active && message.flags?.['foundryvtt-simple-calendar']) {
            now = SimpleCalendar.api.timestampToDate(message.flags['foundryvtt-simple-calendar']['sc-timestamps'].timestamp);
            hour = now.hour;
            season = now.currentSeason.name.toLowerCase();
            date = now.display.date;
            short = SimpleCalendar.api.formatTimestamp(message.flags['foundryvtt-simple-calendar']['sc-timestamps'].timestamp, 'MMM DD, YY');
        };

        let dark = game.i18n.localize(`${this.ID}.quaters.dark`);
        let light = game.i18n.localize(`${this.ID}.quaters.light`);
        let quaters = [
            { name: game.i18n.localize(`${this.ID}.quaters.night`), spring: dark, summer: dark, autumn: dark, winter: dark },
            { name: game.i18n.localize(`${this.ID}.quaters.morning`), spring: light, summer: light, autumn: light, winter: dark },
            { name: game.i18n.localize(`${this.ID}.quaters.day`), spring: light, summer: light, autumn: light, winter: light },
            { name: game.i18n.localize(`${this.ID}.quaters.evening`), spring: dark, summer: light, autumn: dark, winter: dark }
        ];
        let no = (hour > 17) ? 3 : (hour > 11) ? 2 : (hour > 5) ? 1 : 0;

        return { date: date, quater: quaters[no].name, light: quaters[no][season], short: `${short} ${quaters[no].name}` };
    };

    /**
     * Draw card
     * 
     * @param {string} deck - the Card Stacks Deck ID or Name
     * @param {string} discardPile - the Card Stacks Discard Pile ID or Name
     * @param {Number} number - the number of cards to be drawn
     * 
     * @returns {jQuery} the Foundry VTT card object
     */
    static async #drawCard(deck, discardPile, number) {
        this.log(this.#DEBUG, 'drawCard', deck, discardPile, number);

        let deckCards = game.cards.get(deck) ?? game.cards.getName(deck);
        if (!deckCards) return ui.notifications.error(game.i18n.format(`${this.ID}.macro.cardstack.error`, { idOrName: deck }), { permanent: true });

        let discardPileCards = game.cards.get(discardPile) ?? game.cards.getName(discardPile);
        if (!discardPileCards) return ui.notifications.error(game.i18n.format(`${this.ID}.macro.cardstack.error`, { idOrName: discardPile }), { permanent: true });

        await deckCards.deal([discardPileCards], number, { how: CONST.CARD_DRAW_MODES[`RANDOM`], chatNotification: false });

        let cards = discardPileCards.cards.contents;

        for (const card of cards) {
            card.color = /(clubs|spades)/i.test(card.suit) ? 'black' : 'red';
            card.face = (card.value == 1) ?
                game.i18n.localize(`${this.ID}.card.face.ace`) : (card.value >= 2 && card.value <= 10) ? card.value :
                    (card.value == 11) ? game.i18n.localize(`${this.ID}.card.face.jack`) :
                        (card.value == 12) ? game.i18n.localize(`${this.ID}.card.face.queen`) : game.i18n.localize(`${this.ID}.card.face.king`);
            card.short = `[${card.suit}] ${card.face}`;
        }

        discardPileCards.recall({ chatNotification: false });

        return cards;
    }

    /**
     * Set message fbl-solo-game flags
     * 
     * @param {jQuery} message - the message data
     * @param {jQuery} html - the message html
     */
    static async #setFlags(message) {
        this.log(this.#DEBUG, '#setFlags', message);

        if (!message.flags?.[this.ID]) { // No need to check messages more than one time
            let alias = message?.speaker?.alias ?? game.user.name;
            let html = '';

            if (message.rolls?.[0]?.constructor.name && !message.flags?.core?.RollTable) { // FBLRoll or Core Roll
                const capitalize = s => (s && s.replace(/^\p{CWU}/u, char => char.toLocaleUpperCase(game.i18n.lang))) || '';
                let roll = message.rolls[0];

                if (String(roll.constructor.name) === String('FBLRoll')) { // FBLRoll
                    html = game.i18n.format(`${this.ID}.roll.dice.html`, {
                        alias: alias,
                        total: `[x] ${roll.successCount}` +
                            `${roll.options?.isAttack && roll.successCount > 0 ? ` | [d] ${roll.damage}` : ''}` +
                            `${roll.baneCount > 0 ? ` | [l] ${roll.baneCount}` : ''}`,
                        name: `${capitalize(roll.options.name)}${roll.pushed ? ` - ${game.i18n.localize(game.i18n.translations.PUSHED)}` : ''}`
                    });
                } else { // Core Roll
                    html = game.i18n.format(`${this.ID}.roll.dice.html`, {
                        alias: alias,
                        total: roll.total,
                        name: capitalize(roll.formula)
                    });
                }
            } else { // All other messages
                if (message.flags?.['forbidden-lands']?.itemData?.flags?.core?.sourceId) { // Item UUID exists
                    let item = message.flags['forbidden-lands'].itemData;
                    html = game.i18n.format(`${this.ID}.post.item.html`, {
                        type: game.i18n.localize(game.fbl.config.i18n[item.type]),
                        uuid: `@UUID[${item.flags.core.sourceId}]{${item.name}}`
                    });
                } else { // Messages generated by FBL macros without Rolls, or UUID
                    let getNodesIn = (node) => {
                        let getNodes = (node, nodes = []) => {
                            if (node.nodeType == 3 && node.nodeValue.trim()) {
                                node.nodeValue = node.nodeValue.trim();
                                nodes.push(node);
                            } else for (const child of node.childNodes) getNodes(child, nodes);

                            return nodes;
                        };

                        return node ? getNodes(node) : [];
                    };

                    html = game.i18n.format(`${this.ID}.roll.other.html`, {
                        alias: alias,
                        flavor: message.flavor ? `${message.flavor}` : '',
                        delimeter: message.flavor ? `${game.i18n.localize(`${this.ID}.roll.other.delimeter`)}` : '',
                        content: getNodesIn($(message.content).get(0)).map((node) => {
                            if (node.parentElement.nodeName === 'H3') {
                                return `$capital[${node.textContent}]`;
                            } else if (node.parentElement.nodeName === 'H4') {
                                return `<em>${node.textContent}</em>`;
                            } else {
                                return node.textContent;
                            };
                        }).join(' ').trim()
                    });
                }
            }

            if (html !== '') await message.setFlag(this.ID, 'html', html);
        }
    };

    /**
     * Write message to clipboard
     * 
     * @param {jQuery} message 
     */
    static async #setClipboard(message) {
        let copyAs = 'HTML';

        if (!game.settings.get(this.ID, 'contextMenuCopyAsHTML')) {
            copyAs = 'plain text';
            message.html = $(message.html).text();
        }

        try {
            this.log(this.#DEBUG, 'try: navigator.clipboard.writeText');

            await navigator.clipboard.writeText(message.html).then(
                () => { ui.notifications.notify(game.i18n.format(`${this.ID}.message.copy.success`, { type: message.type, copyAs })); },
                () => { ui.notifications.notify(game.i18n.format(`${this.ID}.message.copy.error`, { type: message.type })); },
            );
        } catch (error) {
            this.log(this.#DEBUG, 'catch: fallback document.execCommand', error);

            var temp = $('<textarea>', { 'style': 'width: 1em; height: 1em; position: absolute; z-index: -999; opacity: 0;' });
            $('body').append(temp);
            temp.text(`${message.html}`)
                .trigger('select')
                .on('focus', function () { document.execCommand('selectAll', false, null); })
                .trigger('focus');
            if (document.execCommand('copy')) {
                ui.notifications.notify(game.i18n.format(`${this.ID}.message.copy.success`, { type: message.type, copyAs }));
            } else {
                ui.notifications.notify(game.i18n.format(`${this.ID}.message.copy.error`, { type: message.type }));
            };
            temp.remove();
        }
        this.log(this.#DEBUG, 'setClipboard', message.type, message.html);
    }

    /**
     * Append message to journal
     * 
     * @param {jQuery} message 
     */
    static async #setJournal(message) {
        let journal = game.journal.get(game.settings.get(this.ID, 'travelJournal')).pages.get(game.settings.get(this.ID, 'travelJournalPage'));
        let template = `modules/${this.ID}/templates/insertJournal.hbs`;
        let content = await renderTemplate(template, { type: 'container' });

        let html = $(journal.text.content || content);

        if (game.settings.get(this.ID, 'travelJournalPagePrepend')) html.prepend(message.html);
        else html.append(message.html);

        await journal.update({ 'text.content': html.prop('outerHTML') }).then(
            () => { ui.notifications.notify(game.i18n.format(`${this.ID}.message.insert.success`, { type: message.type, journal: journal.name })); },
            () => { ui.notifications.notify(game.i18n.format(`${this.ID}.message.insert.error`, { type: message.type, journal: journal.name })); }
        );
        this.log(this.#DEBUG, 'appendJournal', message.type, message.html);
    }

    /**
     * A small helper function which leverages developer mode flags to gate debug logs.
     * 
     * @param {boolean} force - forces the log even if the debug flag is not on
     * @param {...any} args - what to log
     */
    static log(force, ...args) {
        const shouldLog = force;

        if (shouldLog) {
            console.log(this.NAME, '|', ...args);
        };
    };
};

/**
 * As soon as Foundry VTT has been initialized, Forbidden Lands - Solo Game Module is initialized
 */
Hooks.once('init', () => {
    FBLSoloGame.init();
});