"""Export the model as a Radiant map (Metaculus map-forecasting-research payload format)."""
import json, sys
from pathlib import Path
HERE = Path(__file__).parent
from dataclasses import dataclass, field


@dataclass
class Edge:
    source: str
    target: str
    type: str = "causal"
    directed: bool = True


@dataclass
class MapIR:
    """The node/edge shape used by Metaculus's map-forecasting-research (github.com/Metaculus/map-forecasting-research)."""
    name: str
    nodes: dict
    edges: list
    meta: dict = field(default_factory=dict)

    def save(self, path):
        path.write_text(json.dumps({"name": self.name, "meta": self.meta, "nodes": self.nodes, "edges": [vars(e) for e in self.edges]}, indent=1, ensure_ascii=False))

    def sinks(self):
        outs = {e.source for e in self.edges}
        return [k for k in self.nodes if k not in outs]


def to_radiant_payload(ir: MapIR) -> dict:
    """The minimal project payload Radiant's importer accepts (same fields as map-forecasting-research)."""
    nodes = [{"node_id": slug, "node_type": "custom", "position_x": (i % 6) * 320, "position_y": (i // 6) * 180,
              "data": {"title": n["title"], "description": n.get("desc", ""), "nodeType": "custom", **({"isMainNode": True} if n.get("is_main") else {})}}
             for i, (slug, n) in enumerate(ir.nodes.items())]
    edges = [{"edge_id": f"edge-{i}", "source_node_id": e.source, "target_node_id": e.target, "edge_type": "custom",
              "data": {"type": e.type, "arrowDirection": "forward" if e.directed else "none"}} for i, e in enumerate(ir.edges)]
    return {"project": {"title": ir.name, "project_type": "free_form"}, "project_nodes": nodes, "project_edges": edges}
import ubi_model as um                                     # noqa: E402

R = json.loads((HERE / "results.json").read_text())
I = um.INPUTS
pct = lambda x: f"{100*x:.0f}%"
rng = lambda k: f"{I[k].lo:g}–{I[k].hi:g}, probably {I[k].mode:g}"
band = lambda x: pct(x)

def desc(*keys, extra=""):
    lines = [f"- {k}: {rng(k)}. {I[k].note} Evidence: {I[k].anchor}" for k in keys]
    return (extra + "\n" if extra else "") + "\n".join(lines)

cum = R["cumulative_ubi_6k"]; att = R["attribution_by_2040"]
nodes = {
  "ev_markets_ai": {"title": "Evidence: AI and labor markets (Manifold)", "desc": "AGI before 2030 53% (342 traders); before 2040 72%; AI unemployment >10% before 2030 23% (175); ACX visible macro break by 2028 30% (643). Fetched 2026-09-29."},
  "ev_markets_politics": {"title": "Evidence: control markets (Polymarket)", "desc": "2026 House D 92.5%; Senate D 62.5%; 2028 presidency D 64.5%. Fetched 2026-09-29."},
  "ai_shock_timing": {"title": "AI labor shock onset year", "desc": desc("shock_by_2028", "shock_by_2030", "shock_by_2035", "shock_by_2040", "shock_by_2050", extra="Cumulative probability of sustained, economist-attributed AI displacement of about 3 pp or more of unemployment.")},
  "political_lag": {"title": "Lag from shock to legislation", "desc": desc("politics_lag_years")},
  "demand_state": {"title": "Demand state each year (normal / AI shock)", "desc": f"Derived. Shock drives politics by 2040 in {pct(att['p_shock_drives_politics_by_2040'])} of simulated histories."},
  "control_2027": {"title": "Control 2027–28", "desc": desc("p_R_trifecta_2027")},
  "control_2029": {"title": "Control 2029–30", "desc": desc("p_D_trifecta_2029", "p_R_trifecta_2029")},
  "control_later": {"title": "Control 2031–2050", "desc": desc("p_D_trifecta_later", "p_R_trifecta_later", "p_keep_trifecta_midterm")},
  "enactment_hazard": {"title": "Chance a universal recurring payment is enacted (per term)", "desc": desc("q_any_D_normal", "q_any_R_normal", "q_any_div_normal", "q_any_D_shock", "q_any_R_shock", "q_any_div_shock")},
  "program_amount": {"title": "Amount per adult (2026 $) and later increases", "desc": desc("amount_median_normal", "amount_median_shock", "ratchet_per_year", extra="The judgment input that matters most for the headline.")},
  "ubi_6k_when": {"title": "US enacts a UBI of $6,000+/adult/yr: when?", "is_main": True, "desc": "Cumulative: " + "; ".join(f"by {y} {band(cum[y])}" for y in ("2032", "2036", "2040", "2050")) + f". Of enactments by 2040: {pct(att['share_in_shock_state'])} happen during a shock; D trifecta {pct(att['share_D_trifecta'])}, R {pct(att['share_R_trifecta'])}, divided {pct(att['share_divided'])}."},
  "ladder_2036": {"title": "Universal payment by 2036, by amount", "desc": "; ".join(f"{k} {band(v)}" for k, v in R["m2_amount_ladder_by_2036"].items())},
  "floor_2036": {"title": "Guaranteed $6k floor for a non-disabled adult by 2036 (NIT counts)", "desc": desc("q_floor_D_normal", "q_floor_R_normal", "q_floor_D_shock", "q_floor_R_shock", "q_floor_div_shock", extra="Result: " + band(R["m3_guaranteed_floor_by_2036"]))},
  "ctc_full": {"title": "CTC's full amount for families with no earnings: first tax year", "desc": desc("q_ctc_D", "q_ctc_R", "q_ctc_div", "p_ctc_same_tax_year", extra="Result: " + "; ".join(f"{k} {band(v)}" for k, v in R["m4_ctc_first_tax_year"].items()))},
  "primary_2028": {"title": "A 2028 primary winner has backed a UBI", "desc": desc("p_2028_primary_winner_backs_ubi", extra="Standalone in the model; a leading indicator of party willingness.")},
}
for n in nodes.values():
    n.setdefault("is_main", False); n["node_type"] = "custom"
E = lambda s, t, ty="causal": Edge(s, t, ty)
edges = [E("ev_markets_ai", "ai_shock_timing", "evidential"), E("ev_markets_politics", "control_2027", "evidential"),
         E("ev_markets_politics", "control_2029", "evidential"), E("ai_shock_timing", "demand_state"),
         E("political_lag", "demand_state"), E("demand_state", "enactment_hazard"), E("demand_state", "program_amount"),
         E("control_2027", "enactment_hazard"), E("control_2029", "enactment_hazard"), E("control_later", "enactment_hazard"),
         E("enactment_hazard", "ubi_6k_when"), E("program_amount", "ubi_6k_when"), E("enactment_hazard", "ladder_2036"),
         E("program_amount", "ladder_2036"), E("ubi_6k_when", "floor_2036", "sufficient"), E("demand_state", "floor_2036"),
         E("control_later", "floor_2036"), E("control_2029", "ctc_full"), E("control_later", "ctc_full"),
         E("primary_2028", "enactment_hazard", "evidential")]
ir = MapIR("US universal basic income: decomposed forecast (2026-09-29)", nodes, edges)
ir.save(HERE / "ubi_map_ir.json")
(HERE / "ubi_map_radiant.json").write_text(json.dumps(to_radiant_payload(ir), indent=1, ensure_ascii=False))
print(len(nodes), "nodes,", len(edges), "edges; sinks:", ir.sinks())
