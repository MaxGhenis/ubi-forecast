"""The paper wrapper embeds the manuscript with one version parameter everywhere."""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
WRAPPER = (HERE / "wrapper" / "index.html").read_text()


def test_iframe_and_links_share_one_version():
    versions = set(re.findall(r'web/index\.(?:html|pdf)\?v=([\w-]+)', WRAPPER))
    assert len(versions) == 1, versions
    iframe = re.search(r'<iframe src="web/index\.html\?v=([\w-]+)"', WRAPPER)
    assert iframe and iframe.group(1) in versions


def test_relative_urls_only_for_the_manuscript():
    assert "https://maxghenis.com/ubi-forecast/paper/web" not in WRAPPER
    assert 'href="../"' in WRAPPER


def test_sandboxed_lazy_iframe_with_title():
    tag = re.search(r"<iframe[^>]+>", WRAPPER, re.S).group(0)
    for attr in ['loading="lazy"', 'title="', 'sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"', 'referrerpolicy="same-origin"']:
        assert attr in tag, attr


def test_description_numbers_match_the_manuscript_variables():
    V = dict(re.findall(r'^(\w+): "([^"]*)"$', (HERE / "_variables.yml").read_text(), re.M))
    for key in ["usa_2040", "usa_2050", "all_t2_2040", "usa_noshock_2040", "all_end2030"]:
        assert V[key] in WRAPPER, key


def test_rendered_manuscript_exists():
    assert (HERE / "_output" / "index.html").exists() or (HERE / "index.html").exists()
