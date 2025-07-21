import type { PubChemSection } from "../types/pubchem";

export async function getPubChemCID(smiles: string): Promise<number | null> {
  const searchUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(
    smiles
  )}/cids/JSON`;
  try {
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`PubChem search failed: ${searchResponse.status}`);
    }
    const searchData = await searchResponse.json();
    if (!searchData.IdentifierList?.CID?.[0]) {
      return null;
    }
    return searchData.IdentifierList.CID[0];
  } catch (e) {
    return null;
  }
}

export async function getCASByCID(cid: number): Promise<string | null> {
  const casUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/synonyms/JSON`;
  const casResponse = await fetch(casUrl);
  if (!casResponse.ok) throw new Error("CAS query failed");
  const casData = await casResponse.json();
  const synonyms = casData.InformationList?.Information?.[0]?.Synonym || [];
  const casNumber = synonyms.find(
    (syn) => /^\d+-\d{2}-\d$/.test(syn) && !syn.startsWith("EC")
  );
  return casNumber || null;
}

export async function getPubChemData(cid: number): Promise<any> {
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON/`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch PubChem data");
  }
  return await response.json();
}

export async function getIUPACNameByCID(cid: number): Promise<string | null> {
  const nameUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/IUPACName/JSON`;
  const nameResponse = await fetch(nameUrl);
  if (!nameResponse.ok) {
    throw new Error("Failed to fetch IUPACName");
  }
  const nameData = await nameResponse.json();
  return nameData.PropertyTable?.Properties?.[0]?.IUPACName || null;
}

export function findDrugBankId(
  sections: PubChemSection[]
): { id: string; url: string } | null {
  for (const section of sections || []) {
    if (section.TOCHeading === "DrugBank ID") {
      const info = section.Information?.[0];
      if (info) {
        if (info.URL) {
          const id = info.Value?.StringWithMarkup?.[0]?.String;
          if (id) {
            return {
              id,
              url: info.URL,
            };
          }
        }
        if (info.Value?.StringWithMarkup?.[0]?.String) {
          const id = info.Value.StringWithMarkup[0].String;
          return { id, url: `https://go.drugbank.com/drugs/${id}` };
        }
      }
    }
    if (section.Section) {
      const result = findDrugBankId(section.Section);
      if (result) return result;
    }
  }
  return null;
}

export function findWikipediaLink(
  sections: PubChemSection[],
  recordTitle: string,
  synonyms: string[] = []
): string | null {
  for (const section of sections || []) {
    if (section.TOCHeading === "Wikipedia") {
      const information = section.Information || [];
      if (information.length > 0) {
        const titlesToMatch = [recordTitle, ...synonyms]
          .filter(Boolean)
          .map((t) => t.toLowerCase());

        for (const info of information) {
          const wikiTitle =
            info.Value?.StringWithMarkup?.[0]?.String?.toLowerCase();
          if (wikiTitle && titlesToMatch.includes(wikiTitle)) {
            return info.URL ?? null;
          }
        }

        for (const info of information) {
          const wikiTitle =
            info.Value?.StringWithMarkup?.[0]?.String?.toLowerCase();
          if (wikiTitle) {
            for (const titleToMatch of titlesToMatch) {
              if (
                titleToMatch.includes(wikiTitle) ||
                wikiTitle.includes(titleToMatch)
              ) {
                return info.URL ?? null;
              }
            }
          }
        }

        const firstInfo = information[1];
        if (firstInfo && firstInfo.URL) {
          return firstInfo.URL;
        }
      }
    }
    if (section.Section) {
      const result = findWikipediaLink(section.Section, recordTitle, synonyms);
      if (result) return result;
    }
  }
  return null;
} 