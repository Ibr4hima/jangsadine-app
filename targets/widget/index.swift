import WidgetKit
import SwiftUI

// ─── Données partagées (App Group) ────────────────────────────
// L'app écrit un JSON { ville, jours: [{ date: "yyyy-MM-dd",
// heures: [["Fajr","05:41"], …] }] } dans les UserDefaults du groupe.

let APP_GROUP = "group.com.jangsadine.app"

struct JourPrieres: Codable {
    let date: String
    let heures: [[String]]
}
struct DonneesPrieres: Codable {
    let ville: String
    let jours: [JourPrieres]
}

// ─── Palette (identique à l'app) ──────────────────────────────
let BLEU_HAUT = Color(red: 0x3D / 255, green: 0x6B / 255, blue: 0xA3 / 255)
let BLEU_MILIEU = Color(red: 0x2D / 255, green: 0x57 / 255, blue: 0x8C / 255)
let BLEU_BAS = Color(red: 0x23 / 255, green: 0x4A / 255, blue: 0x7A / 255)
let OR = Color(red: 0xD6 / 255, green: 0xAD / 255, blue: 0x3A / 255)

// ─── Entrée de timeline ───────────────────────────────────────
struct Entree: TimelineEntry {
    let date: Date
    let ville: String
    /// Les 5 prières du jour concerné : (nom, "HH:mm")
    let prieres: [(String, String)]
    /// Index de la prochaine prière dans `prieres`
    let prochaineIdx: Int
    /// Moment exact de la prochaine prière (compte à rebours)
    let prochaineDate: Date
    let aDonnees: Bool
}

// ─── Provider ─────────────────────────────────────────────────
struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> Entree {
        Entree(
            date: Date(), ville: "Dakar",
            prieres: [("Fajr", "05:41"), ("Dhuhr", "13:15"), ("Asr", "16:38"), ("Maghrib", "19:43"), ("Isha", "20:58")],
            prochaineIdx: 2, prochaineDate: Date().addingTimeInterval(3600),
            aDonnees: true
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (Entree) -> Void) {
        completion(chargerEntrees().first ?? placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entree>) -> Void) {
        let entrees = chargerEntrees()
        if entrees.isEmpty {
            let vide = Entree(
                date: Date(), ville: "", prieres: [],
                prochaineIdx: 0, prochaineDate: Date().addingTimeInterval(3600),
                aDonnees: false
            )
            // Réessaie dans une heure (l'app n'a pas encore écrit les données)
            completion(Timeline(entries: [vide], policy: .after(Date().addingTimeInterval(3600))))
            return
        }
        completion(Timeline(entries: entrees, policy: .atEnd))
    }

    /// Construit les entrées : une par changement de « prochaine prière »
    /// sur ~48 h. Chaque entrée porte les 5 horaires du jour à afficher.
    private func chargerEntrees() -> [Entree] {
        guard
            let brut = UserDefaults(suiteName: APP_GROUP)?.string(forKey: "prieres"),
            let donnees = try? JSONDecoder().decode(DonneesPrieres.self, from: Data(brut.utf8))
        else { return [] }

        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd HH:mm"
        fmt.timeZone = TimeZone.current

        // Aplatis : chaque moment de prière daté, avec son jour d'origine
        struct Moment { let date: Date; let idx: Int; let jour: JourPrieres }
        var moments: [Moment] = []
        for jour in donnees.jours {
            for (i, paire) in jour.heures.enumerated() {
                if paire.count >= 2, let d = fmt.date(from: "\(jour.date) \(paire[1])") {
                    moments.append(Moment(date: d, idx: i, jour: jour))
                }
            }
        }
        moments.sort { $0.date < $1.date }

        let maintenant = Date()
        var entrees: [Entree] = []
        var debut = maintenant
        for m in moments {
            guard m.date > maintenant else { continue }
            entrees.append(Entree(
                date: debut,
                ville: donnees.ville,
                prieres: m.jour.heures.map { ($0.first ?? "", $0.count > 1 ? $0[1] : "") },
                prochaineIdx: m.idx,
                prochaineDate: m.date,
                aDonnees: true
            ))
            debut = m.date
            if entrees.count >= 12 { break }
        }
        return entrees
    }
}

// ─── Vues ─────────────────────────────────────────────────────
struct FondBleu: View {
    var body: some View {
        LinearGradient(
            colors: [BLEU_HAUT, BLEU_MILIEU, BLEU_BAS],
            startPoint: .topLeading, endPoint: .bottomTrailing
        )
    }
}

struct VueVide: View {
    var body: some View {
        VStack(spacing: 6) {
            Text("Jàng sa Diné")
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundColor(.white)
            Text("Ouvrez l'app pour afficher les horaires")
                .font(.system(size: 11))
                .foregroundColor(.white.opacity(0.65))
                .multilineTextAlignment(.center)
        }
    }
}

// Petit format : la prochaine prière, en grand
struct VuePetite: View {
    let entree: Entree
    var body: some View {
        if !entree.aDonnees || entree.prieres.isEmpty {
            VueVide()
        } else {
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 4) {
                    Text("PROCHAINE PRIÈRE")
                        .font(.system(size: 8, weight: .bold))
                        .tracking(1.2)
                        .foregroundColor(OR)
                    Spacer()
                }
                if !entree.ville.isEmpty {
                    Text(entree.ville)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.white.opacity(0.55))
                        .padding(.top, 2)
                }
                Spacer()
                Text(entree.prieres[entree.prochaineIdx].0)
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                    .minimumScaleFactor(0.7)
                Text(entree.prieres[entree.prochaineIdx].1)
                    .font(.system(size: 26, weight: .bold, design: .rounded))
                    .foregroundColor(OR)
                    .monospacedDigit()
                Spacer()
                // Compte à rebours vivant (mis à jour par le système)
                Text(entree.prochaineDate, style: .relative)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundColor(.white.opacity(0.7))
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
        }
    }
}

// Format moyen : prochaine prière + les 5 horaires du jour
struct VueMoyenne: View {
    let entree: Entree
    var body: some View {
        if !entree.aDonnees || entree.prieres.isEmpty {
            VueVide()
        } else {
            VStack(spacing: 0) {
                HStack(alignment: .firstTextBaseline) {
                    VStack(alignment: .leading, spacing: 1) {
                        HStack(spacing: 6) {
                            Text("PROCHAINE PRIÈRE")
                                .font(.system(size: 8, weight: .bold))
                                .tracking(1.4)
                                .foregroundColor(OR)
                            if !entree.ville.isEmpty {
                                Text("·  \(entree.ville)")
                                    .font(.system(size: 9, weight: .medium))
                                    .foregroundColor(.white.opacity(0.5))
                            }
                        }
                        HStack(alignment: .firstTextBaseline, spacing: 8) {
                            Text(entree.prieres[entree.prochaineIdx].0)
                                .font(.system(size: 21, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                            Text(entree.prieres[entree.prochaineIdx].1)
                                .font(.system(size: 20, weight: .bold, design: .rounded))
                                .foregroundColor(OR)
                                .monospacedDigit()
                        }
                    }
                    Spacer()
                    Text(entree.prochaineDate, style: .relative)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(.white.opacity(0.75))
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Capsule().fill(Color.white.opacity(0.12)))
                }
                Spacer()
                HStack(spacing: 5) {
                    ForEach(Array(entree.prieres.enumerated()), id: \.offset) { i, p in
                        let actif = i == entree.prochaineIdx
                        VStack(spacing: 3) {
                            Text(p.0)
                                .font(.system(size: 9, weight: actif ? .bold : .medium))
                                .foregroundColor(actif ? OR : .white.opacity(0.55))
                                .lineLimit(1)
                                .minimumScaleFactor(0.7)
                            Text(p.1)
                                .font(.system(size: 12, weight: actif ? .bold : .regular))
                                .foregroundColor(actif ? OR : .white.opacity(0.85))
                                .monospacedDigit()
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 6)
                        .background(
                            RoundedRectangle(cornerRadius: 10)
                                .fill(actif ? OR.opacity(0.16) : Color.clear)
                        )
                    }
                }
            }
        }
    }
}

struct PrieresWidgetView: View {
    @Environment(\.widgetFamily) var famille
    let entree: Entree
    var body: some View {
        Group {
            switch famille {
            case .systemMedium: VueMoyenne(entree: entree)
            default: VuePetite(entree: entree)
            }
        }
        .containerBackground(for: .widget) { FondBleu() }
    }
}

// ─── Widget ───────────────────────────────────────────────────
struct PrieresWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "PrieresWidget", provider: Provider()) { entree in
            PrieresWidgetView(entree: entree)
        }
        .configurationDisplayName("Heures de prière")
        .description("La prochaine prière et les horaires du jour.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct PrieresWidgetBundle: WidgetBundle {
    var body: some Widget {
        PrieresWidget()
    }
}
