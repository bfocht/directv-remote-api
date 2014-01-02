$(document).ready(function() {
    
  var dtvRemote;
  var selectedClient;

    var logCallback = function(result)
    {

		var txt = $.toJSON(result);
		var box = $("#callbackLog");
	    box.val(box.val()+"\r\n\r\n" + txt);
	}

    var refreshCurrentChannel = function() {
      dtvRemote.getTuned({
        clientAddr: selectedClient, callback: function (result) {
          logCallback(result);
            if (result.episodeTitle) {
                $('#program-title').html(result.title + ' <small>' + result.episodeTitle + '</small>');
            } else {
                $('#program-title').text(result.title);
            }

            $('#program-callsign').html(result.callsign + ' <small>' + result.major + '</small>');
        }});
    };

    var setClientAddr = function (result) {
      logCallback(result);
      if (result.locations)
      {
        $('#select-stb-btn-group').empty();
        result.locations.map(function (location) {
          $('#select-stb-btn-group').append('<button type="button" class="btn btn-primary stb-button" data-value="' + location.clientAddr + '"  >' + location.locationName + '</button>');
        });
        $('#select-stb-dialog').modal('show');
      }
    };

    $('.stb-button').live('click', function () {
      selectedClient = $(this).attr('data-value');
      refreshCurrentChannel();
      $('#select-stb-dialog').modal('hide');
    });


	// Click handler for the remote buttons
    $('#function-buttons a.btn').click(function(e) {
        if (this.id=="clearlog")
        {
			$("#callbackLog").val("");
			return;
		}
		if (this.id=="getTuned")
		{
			refreshCurrentChannel();
		}
		if (this.id=="getLocations")
		{
			dtvRemote.getLocations({callback: setClientAddr});
		}
    });

    // Click handler for the remote buttons
    $('#remote-buttons a.btn').click(function(e) {
        if (this.id=="advance2")
		{
          dtvRemote.processKey({
            clientAddr: selectedClient, hold: "keyPress", key: "advance", callback: function (result) {
						logCallback(result);
						if (result.status.code !== 200) {
							alert(result.status.msg);
						}
			}});
			 var t=setTimeout(
				dtvRemote.processKey({
				  clientAddr: selectedClient, hold: "keyPress", key: "advance", callback: function (result) {
							logCallback(result);
							if (result.status.code !== 200) {
								alert(result.status.msg);
							}
				}}),1000
			);

			return;
		}

        dtvRemote.processKey({
          clientAddr: selectedClient, hold: "keyPress", key: this.id, callback: function (result) {
			logCallback(result);
            if (result.status.code !== 200) {
                alert(result.status.msg);
            }
        }});
    });

    // Enter handler
    $('#ip-address-input').keypress(function(e) {
        if(e.which === 13) {
            $('#ip-address-submit').click();
            e.preventDefault();
        }
    });

    // Click handler for the IP address modal
    $('#ip-address-submit').click(function(e) {
        $('#ip-address-dialog button.btn').toggleClass('disabled');

        try {

            dtvRemote = new DirecTV.Remote({ipAddress: $('#ip-address-input').val()});
        } catch (err) {

            alert(err);
            $('#ip-address-dialog button.btn').toggleClass('disabled');
        }

        dtvRemote.validate({callback: function(result) {
          logCallback(result);
          if (result.status.code === 200) {
            // Initialize the remote
            dtvRemote.getLocations({
              callback: function (result) {
                setClientAddr(result);
                $('#main-container').empty();
                $('#main-container').append($('#main-content'));
                $('#main-content').toggleClass('hide');
                $.cookie("dtv-data", $('#ip-address-input').val(), { expires: 9999 });

                $('#ip-address-dialog').modal('hide');
              }
            });
            } else {
                alert(result.status.msg);
                $('#ip-address-dialog button.btn').toggleClass('disabled');
            }
        }});
    });

    $('#ip-address-input').val($.cookie("dtv-data"));
    $('#ip-address-dialog').modal('show');
});
