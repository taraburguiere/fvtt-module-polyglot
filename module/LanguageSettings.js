import { availableLanguageProviders, updateLanguageProvider } from "./api.js";

export class PolyglotLanguageSettings extends FormApplication {
	/**
	 * Default Options for this FormApplication
	 */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: "polyglot-language-form",
			title: "Polyglot Language Settings",
			template: "./modules/polyglot/templates/LanguageSettings.hbs",
			classes: ["sheet polyglot-language-settings"],
			width: 600,
			height: 680,
			closeOnSubmit: true,
			resizable: true,
		});
	}

	getData(options) {
		const data = {};
		const selectedProvider = game.polyglot.languageProvider.id;
		// Insert all speed providers into the template data
		data.providers = Object.values(availableLanguageProviders).map((languageProvider) => {
			const provider = {};
			provider.id = languageProvider.id;
			let dotPosition = provider.id.indexOf(".");
			if (dotPosition === -1) dotPosition = provider.id.length;
			const type = provider.id.substring(0, dotPosition);
			const id = provider.id.substring(dotPosition + 1);
			if (type === "native") {
				let title = id == game.system.id ? game.system.title : id;
				provider.selectTitle = (game.i18n.localize("POLYGLOT.LanguageProvider.choices.native") + " " + title).trim();
			} else {
				let name;
				if (type === "module") {
					name = game.modules.get(id).title;
				} else {
					name = game.system.title;
				}
				provider.selectTitle = game.i18n.format(`POLYGLOT.LanguageProvider.choices.${type}`, { name });
			}
			provider.isSelected = provider.id === selectedProvider;
			return provider;
		});

		data.providerSelection = {
			id: "languageProvider",
			name: game.i18n.localize("POLYGLOT.LanguageProvider.name"),
			hint: game.i18n.localize("POLYGLOT.LanguageProvider.hint"),
			type: String,
			choices: data.providers.reduce((choices, provider) => {
				choices[provider.id] = provider.selectTitle;
				return choices;
			}, {}),
			value: selectedProvider,
			isCheckbox: false,
			isSelect: true,
			isRange: false,
		};

		this.languageProvider = data.providerSelection.value;

		function prepSetting(key) {
			let settingData = game.settings.settings.get(`polyglot.${key}`);
			return {
				value: game.settings.get("polyglot", `${key}`),
				name: settingData.name,
				hint: settingData.hint,
			};
		}

		return {
			data: data,
			languages: prepSetting("Languages"),
			alphabets: prepSetting("Alphabets"),
		};
	}

	async activateListeners(html) {
		super.activateListeners(html);
		html.find(".polyglot-languageProvider").on("change", (event) => {
			const languagesList = html.find(".polyglot-languages-list")[0];
			const languagesTitle = html.find(".polyglot-languages-title-notes")[0];
			const languagesWarning = html.find(".polyglot-languages-warn")[0];
			const shouldDisplayLanguages = this.languageProvider === event.target.value;
			languagesList.style.display = shouldDisplayLanguages ? "block" : "none";
			languagesTitle.style.display = shouldDisplayLanguages ? "block" : "none";
			languagesWarning.style.display = shouldDisplayLanguages ? "none" : "block";
		});
		html.find(".polyglot-alphabet").each(function () {
			const font = this.previousSibling.previousSibling.children[0].value; //selectatr's value
			this.style.font = game.polyglot.languageProvider.alphabets[font];
		});
		html.find(".selectatr").on("change", (event) => {
			const font = event.target.value;
			const parentElement = event.target.parentElement;
			const nextSibling = parentElement.nextSibling;
			if (nextSibling && nextSibling.nextSibling) {
				const elementToChange = nextSibling.nextSibling;
				const alphabet = game.polyglot.languageProvider.alphabets[font];
				elementToChange.style.font = alphabet;
			}
		});
		html.find("button").on("click", async (event) => {
			if (event.currentTarget?.dataset?.action === "reset") {
				game.polyglot.languageProvider.loadAlphabet();
				await game.settings.set("polyglot", "Alphabets", game.polyglot.languageProvider.alphabets);
				await game.settings.set("polyglot", "Languages", game.polyglot.languageProvider.originalTongues);
				this.close();
			}
		});
	}

	/**
	 * Executes on form submission
	 * @param {Event} ev - the form submission event
	 * @param {Object} formData - the form data
	 */
	async _updateObject(ev, formData) {
		const languageProvider = game.settings.get("polyglot", "languageProvider");
		if (languageProvider != formData.languageProvider) {
			await game.settings.set("polyglot", "languageProvider", formData.languageProvider);
			updateLanguageProvider();
			game.polyglot.languageProvider.loadAlphabet();
			await game.settings.set("polyglot", "Alphabets", game.polyglot.languageProvider.alphabets);
			await game.settings.set("polyglot", "Languages", game.polyglot.languageProvider.originalTongues);
		} else {
			let langSettings = game.settings.get("polyglot", "Languages");
			const iterableSettings = formData["language.alphabet"];
			let i = 0;
			for (let lang in langSettings) {
				langSettings[lang] = iterableSettings[i];
				i++;
			}
			game.polyglot.languageProvider.tongues = langSettings;
			await game.settings.set("polyglot", "Languages", langSettings);
		}
	}
}
