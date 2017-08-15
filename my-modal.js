(function($) {
	var _modalTemplateTempDiv = document.createElement('div');
	
	var defaults = {
        modalStack: true,
        modalButtonOk: '确定',
        modalButtonCancel: '取消',
        modalPreloaderTitle: '加载中',
        modalContainer : document.body ? document.body : 'body'
    };

	$.extend({
		modal: function(params) {
			params = params || {};
			var modalHTML = '';
			var buttonsHTML = '';
			if(params.buttons && params.buttons.length > 0) {
				for(var i = 0; i < params.buttons.length; i++) {
					buttonsHTML += '<span class="modal-button' + (params.buttons[i].bold ? ' modal-button-bold' : '') + '">' + params.buttons[i].text + '</span>';
				}
			}
			var extraClass = params.extraClass || '';
			var titleHTML = params.title ? '<div class="modal-title">' + params.title + '</div>' : '';
			var textHTML = params.text ? '<div class="modal-text">' + params.text + '</div>' : '';
			var afterTextHTML = params.afterText ? params.afterText : '';
			var noButtons = !params.buttons || params.buttons.length === 0 ? 'modal-no-buttons' : '';
			var verticalButtons = params.verticalButtons ? 'modal-buttons-vertical' : '';
			modalHTML = '<div class="modal ' + extraClass + ' ' + noButtons + '"><div class="modal-inner">' + (titleHTML + textHTML + afterTextHTML) + '</div><div class="modal-buttons ' + verticalButtons + '">' + buttonsHTML + '</div></div>';

			_modalTemplateTempDiv.innerHTML = modalHTML;

			var modal = $(_modalTemplateTempDiv).children();

			$(defaults.modalContainer).append(modal[0]);

			// Add events on buttons
			modal.find('.modal-button').each(function(index, el) {
				$(el).on('click', function(e) {
					if(params.buttons[index].close !== false) $.closeModal(modal);
					if(params.buttons[index].onClick) params.buttons[index].onClick(modal, e);
					if(params.onClick) params.onClick(modal, index);
				});
			});
			$.openModal(modal);
			return modal[0];
		},
		
		actions: function(params) {
			var modal, groupSelector, buttonSelector;
			params = params || [];

			if(params.length > 0 && !$.isArray(params[0])) {
				params = [params];
			}
			
			var modalHTML;
			var buttonsHTML = '';
			for(var i = 0; i < params.length; i++) {
				for(var j = 0; j < params[i].length; j++) {
					if(j === 0) buttonsHTML += '<div class="actions-modal-group">';
					var button = params[i][j];
					var buttonClass = button.label ? 'actions-modal-label' : 'actions-modal-button';
					if(button.bold) buttonClass += ' actions-modal-button-bold';
					if(button.color) buttonClass += ' color-' + button.color;
					if(button.bg) buttonClass += ' bg-' + button.bg;
					if(button.disabled) buttonClass += ' disabled';
					buttonsHTML += '<span class="' + buttonClass + '">' + button.text + '</span>';
					if(j === params[i].length - 1) buttonsHTML += '</div>';
				}
			}
			modalHTML = '<div class="actions-modal">' + buttonsHTML + '</div>';
			_modalTemplateTempDiv.innerHTML = modalHTML;
			modal = $(_modalTemplateTempDiv).children();
			$(defaults.modalContainer).append(modal[0]);
			groupSelector = '.actions-modal-group';
			buttonSelector = '.actions-modal-button';

			var groups = modal.find(groupSelector);
			groups.each(function(index, el) {
				var groupIndex = index;
				$(el).children().each(function(index, el) {
					var buttonIndex = index;
					var buttonParams = params[groupIndex][buttonIndex];
					var clickTarget;
					if($(el).is(buttonSelector)) clickTarget = $(el);
					if(clickTarget) {
						clickTarget.on('click', function(e) {
							if(buttonParams.close !== false) $.closeModal(modal);
							if(buttonParams.onClick) buttonParams.onClick(modal, e);
						});
					}
				});
			});
			$.openModal(modal);
			return modal[0];
		},
		
		openModal: function(modal, cb) {
			modal = $(modal);
			var isModal = modal.hasClass('modal'),
				isNotToast = !modal.hasClass('toast');
			
			// ???
			if($('.modal.modal-in:not(.modal-out)').length && defaults.modalStack && isModal && isNotToast) {
				$.modalStack.push(function() {
					$.openModal(modal, cb);
				});
				return;
			}
			var isPopup = modal.hasClass('popup');
			var isLoginScreen = modal.hasClass('login-screen');
			var isPickerModal = modal.hasClass('picker-modal');
			var isToast = modal.hasClass('toast');
			
			// 这里有点怪？ actionsheet 没有 .modal 这个  class
			if(isModal) {
				modal.show();
				modal.css({
					marginTop: -Math.round(modal.outerHeight() / 2) + 'px'
				});
			}
			if(isToast) {
				modal.css({
					marginLeft: -Math.round(modal.outerWidth() / 2 / 1.185) + 'px' //1.185 是初始化时候的放大效果
				});
			}

			var overlay;
			if(!isLoginScreen && !isPickerModal && !isToast) {
				if($('.modal-overlay').length === 0 && !isPopup) {
					$(defaults.modalContainer).append('<div class="modal-overlay"></div>');
				}
				if($('.popup-overlay').length === 0 && isPopup) {
					$(defaults.modalContainer).append('<div class="popup-overlay"></div>');
				}
				overlay = isPopup ? $('.popup-overlay') : $('.modal-overlay');
			}

			// Trugger open event
			modal.trigger('open');

			// Picker modal body class
			if(isPickerModal) {
				$(defaults.modalContainer).addClass('with-picker-modal');
			}

			// Classes for transition in
			if(!isLoginScreen && !isPickerModal && !isToast) overlay.addClass('modal-overlay-visible');
			modal.removeClass('modal-out').addClass('modal-in').transitionEnd(function(e) {
				if(modal.hasClass('modal-out')) modal.trigger('closed');
				else modal.trigger('opened');
			});
			// excute callback
			if(typeof cb === 'function') {
				cb.call(this);
			}
			return true;
		},

		closeModal: function(modal) {
			modal = $(modal || '.modal-in');
			if(typeof modal !== 'undefined' && modal.length === 0) {
				return;
			}
			var isModal = modal.hasClass('modal'),
				isPopup = modal.hasClass('popup'),
				isToast = modal.hasClass('toast'),
				isLoginScreen = modal.hasClass('login-screen'),
				isPickerModal = modal.hasClass('picker-modal'),
				removeOnClose = modal.hasClass('remove-on-close'),
				overlay = isPopup ? $('.popup-overlay') : $('.modal-overlay');
			if(isPopup) {
				if(modal.length === $('.popup.modal-in').length) {
					overlay.removeClass('modal-overlay-visible');
				}
			} else if(!(isPickerModal || isToast)) {
				overlay.removeClass('modal-overlay-visible');
			}

			modal.trigger('close');

			// Picker modal body class
			if(isPickerModal) {
				$(defaults.modalContainer).removeClass('with-picker-modal');
				$(defaults.modalContainer).addClass('picker-modal-closing');
			}

			modal.removeClass('modal-in').addClass('modal-out').transitionEnd(function(e) {
				if(modal.hasClass('modal-out')) modal.trigger('closed');
				else modal.trigger('opened');

				if(isPickerModal) {
					$(defaults.modalContainer).removeClass('picker-modal-closing');
				}
				if(isPopup || isLoginScreen || isPickerModal) {
					modal.removeClass('modal-out').hide();
					if(removeOnClose && modal.length > 0) {
						modal.remove();
					}
				} else {
					modal.remove();
				}
			});
			if(isModal && defaults.modalStack) {
				$.modalStackClearQueue();
			}

			return true;
		},
	});
})(jQuery);
