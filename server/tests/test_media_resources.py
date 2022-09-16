import json
import os

from tests.utils.user_test_util import get_login_headers


def test_successful_conversion_svg_to_png(client, clean_test_uploads):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    upload_data = {
        "prefix": "test-prefix",
        "svg": "<svg height=\"670\" version=\"1.1\" width=\"635\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" style=\"overflow: hidden; position: relative;\" viewBox=\"0 0 635 670\"><desc style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0);\">Created with Raphaël 2.3.0</desc><defs style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0);\"></defs><rect x=\"0\" y=\"0\" width=\"10\" height=\"10\" rx=\"0\" ry=\"0\" fill=\"#000000\" stroke=\"#000\" class=\"backgroundLayer\" opacity=\"0.0\" style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0); opacity: 0;\"></rect><rect x=\"0\" y=\"0\" width=\"10\" height=\"10\" rx=\"0\" ry=\"0\" fill=\"#000000\" stroke=\"#000\" class=\"selectionPlateLayer\" opacity=\"0.0\" style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0); opacity: 0;\"></rect><circle cx=\"180.6405080663738\" cy=\"359.0002933408624\" r=\"15.6\" fill=\"none\" stroke=\"#00cc00\" stroke-width=\"1.2\" transform=\"matrix(1,0,0,1,0,0)\" style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0); display: none;\"></circle><rect x=\"0\" y=\"0\" width=\"10\" height=\"10\" rx=\"0\" ry=\"0\" fill=\"#000000\" stroke=\"#000\" class=\"highlightingLayer\" opacity=\"0.0\" style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0); opacity: 0;\"></rect><rect x=\"0\" y=\"0\" width=\"10\" height=\"10\" rx=\"0\" ry=\"0\" fill=\"#000000\" stroke=\"#000\" class=\"warningsLayer\" opacity=\"0.0\" style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0); opacity: 0;\"></rect><path fill=\"none\" stroke=\"#000000\" d=\"M174.64050807,322.46375747L174.64050807,355.53624253M180.64050807,318.99970666L180.64050807,359.00029334\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" transform=\"matrix(1,0,0,1,0,0)\" style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0); stroke-linecap: round; stroke-linejoin: round;\"></path><path fill=\"none\" stroke=\"#000000\" d=\"M146,298.99941332L180.64050807,318.99970666\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" transform=\"matrix(1,0,0,1,0,0)\" style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0); stroke-linecap: round; stroke-linejoin: round;\"></path><path fill=\"none\" stroke=\"#000000\" d=\"M117.35949193,322.46375747L146,305.92766736M111.35949193,318.99970666L146,298.99941332\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" transform=\"matrix(1,0,0,1,0,0)\" style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0); stroke-linecap: round; stroke-linejoin: round;\"></path><path fill=\"none\" stroke=\"#000000\" d=\"M111.35949193,359.00029334L111.35949193,318.99970666\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" transform=\"matrix(1,0,0,1,0,0)\" style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0); stroke-linecap: round; stroke-linejoin: round;\"></path><path fill=\"none\" stroke=\"#000000\" d=\"M146,372.07233264L117.35949193,355.53624253M146,379.00058668L111.35949193,359.00029334\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" transform=\"matrix(1,0,0,1,0,0)\" style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0); stroke-linecap: round; stroke-linejoin: round;\"></path><path fill=\"none\" stroke=\"#000000\" d=\"M180.64050807,359.00029334L146,379.00058668\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" transform=\"matrix(1,0,0,1,0,0)\" style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0); stroke-linecap: round; stroke-linejoin: round;\"></path><path fill=\"none\" stroke=\"#000000\" d=\"M180.64050807,359.00029334L215.28165124,379.00007333\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" transform=\"matrix(1,0,0,1,0,0)\" style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0); stroke-linecap: round; stroke-linejoin: round;\"></path><path fill=\"none\" stroke=\"#000000\" d=\"M215.28165124,379.00007333L249.92254037,359.00044001\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" transform=\"matrix(1,0,0,1,0,0)\" style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0); stroke-linecap: round; stroke-linejoin: round;\"></path><path fill=\"none\" stroke=\"#000000\" d=\"M249.92254037,365.92861784L278.56425763,382.46467846M249.92254037,359.00044001L284.56419163,379.00051334\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" transform=\"matrix(1,0,0,1,0,0)\" style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0); stroke-linecap: round; stroke-linejoin: round;\"></path><path fill=\"none\" stroke=\"#000000\" d=\"M284.56419163,379.00051334L284.56495375,419.00021999\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" transform=\"matrix(1,0,0,1,0,0)\" style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0); stroke-linecap: round; stroke-linejoin: round;\"></path><path fill=\"none\" stroke=\"#000000\" d=\"M278.56488775,415.53613108L249.92406462,432.07167549M284.56495375,419.00021999L249.92406462,438.99985331\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" transform=\"matrix(1,0,0,1,0,0)\" style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0); stroke-linecap: round; stroke-linejoin: round;\"></path><path fill=\"none\" stroke=\"#000000\" d=\"M249.92406462,438.99985331L215.28241336,418.99977998\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" transform=\"matrix(1,0,0,1,0,0)\" style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0); stroke-linecap: round; stroke-linejoin: round;\"></path><path fill=\"none\" stroke=\"#000000\" d=\"M221.28234736,415.53561486L221.28171724,382.46416225M215.28241336,418.99977998L215.28165124,379.00007333\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" transform=\"matrix(1,0,0,1,0,0)\" style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0); stroke-linecap: round; stroke-linejoin: round;\"></path><rect x=\"0\" y=\"0\" width=\"10\" height=\"10\" rx=\"0\" ry=\"0\" fill=\"#000000\" stroke=\"#000\" class=\"dataLayer\" opacity=\"0.0\" style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0); opacity: 0;\"></rect><rect x=\"0\" y=\"0\" width=\"10\" height=\"10\" rx=\"0\" ry=\"0\" fill=\"#000000\" stroke=\"#000\" class=\"indicesLayer\" opacity=\"0.0\" style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0); opacity: 0;\"></rect></svg>",
    }
    rv = client.post('/api/medias/svg-to-png', headers=access_headers, json=upload_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['height'] == 142
    assert res['width'] == 176
    assert type(res['filename']) == str
    assert type(res['originalFilename']) == str
    assert 'test-prefix' in res['originalFilename']
    assert isinstance(res['id'], int)
    assert isinstance(res['timeCreated'], str)
    assert res['timeUpdated'] is None
    assert res['thumbnailXS'] is True
    assert res['thumbnailS'] is True
    assert res['thumbnailM'] is False
    assert res['thumbnailL'] is False
    assert res['thumbnailXL'] is False
    hash_value = res['filename'].split('.')[0]
    assert os.path.isfile('uploads/{}.png'.format(hash_value)) is True
    assert os.path.isfile('uploads/{}_xs.png'.format(hash_value)) is True
    assert os.path.isfile('uploads/{}_s.png'.format(hash_value)) is True
    assert os.path.isfile('uploads/{}_m.png'.format(hash_value)) is False
    assert os.path.isfile('uploads/{}_l.png'.format(hash_value)) is False
    assert os.path.isfile('uploads/{}_xl.png'.format(hash_value)) is False

def test_conversion_svg_to_png_with_bad_svg(client, clean_test_uploads):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    upload_data = {
        "prefix": "test-prefix",
        "svg": "<svg height=\"670\" version=\"1.1\" width=\"635\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" style=\"overflow: hidden; position: relative;\" viewBox=\"0 0 635 670\"><desc style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0);\">Created with Raphaël 2.3.0</desc><defs style=\"-webkit-tap-highlight-color: rgba(0, 0, 0, 0);\"></defs></rect></svg>",
    }
    rv = client.post('/api/medias/svg-to-png', headers=access_headers, json=upload_data)
    assert rv.status_code == 400