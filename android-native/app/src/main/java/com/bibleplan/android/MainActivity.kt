package com.bibleplan.android

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Timeline
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.bibleplan.android.data.api.BibleApiService
import com.bibleplan.android.data.csv.CsvManager
import com.bibleplan.android.data.models.BookProgress
import com.bibleplan.android.data.models.ConnectionArc
import com.bibleplan.android.data.models.DailyReading
import com.bibleplan.android.data.models.ReadingPlan
import com.bibleplan.android.data.models.SecretBook
import com.bibleplan.android.data.models.UserAccount
import com.bibleplan.android.data.preferences.SessionManager
import com.bibleplan.android.theme.AccentGreenBright
import com.bibleplan.android.theme.AccentPurple
import com.bibleplan.android.theme.BgCard
import com.bibleplan.android.theme.BgDark
import com.bibleplan.android.theme.BiblePlanTheme
import com.bibleplan.android.theme.BorderDark
import com.bibleplan.android.theme.TextPrimary
import com.bibleplan.android.theme.TextSecondary
import com.bibleplan.android.ui.components.AppHeader
import com.bibleplan.android.ui.components.AuthDialog
import com.bibleplan.android.ui.components.GeminiSearchDialog
import com.bibleplan.android.ui.screens.GraphScreen
import com.bibleplan.android.ui.screens.PlanSelectorDialog
import com.bibleplan.android.ui.screens.ReadingPlanScreen
import com.bibleplan.android.ui.screens.SecretBooksScreen
import com.bibleplan.android.ui.screens.SettingsScreen
import kotlinx.coroutines.launch
import kotlin.random.Random

class MainActivity : ComponentActivity() {
    private lateinit var sessionManager: SessionManager
    private val apiService = BibleApiService()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        sessionManager = SessionManager(this)

        setContent {
            BiblePlanTheme {
                MainAppScreen()
            }
        }
    }

    @Composable
    private fun MainAppScreen() {
        val scope = rememberCoroutineScope()

        var selectedTab by remember { mutableIntStateOf(0) }
        var showPlanSelector by remember { mutableStateOf(sessionManager.showPlanSelectorOnStartup) }
        var showGeminiSearch by remember { mutableStateOf(false) }
        var showAuthDialog by remember { mutableStateOf(false) }

        var activeAccountId by remember { mutableStateOf(sessionManager.activeAccountId) }
        var activePlanId by remember { mutableStateOf(sessionManager.activePlanId) }
        var sessionToken by remember { mutableStateOf(sessionManager.sessionToken) }
        var showOnStartup by remember { mutableStateOf(sessionManager.showPlanSelectorOnStartup) }

        val accounts = remember { mutableStateListOf<UserAccount>().apply { addAll(sessionManager.getAccounts()) } }
        val activeAccount = accounts.find { it.id == activeAccountId } ?: accounts.first()

        val availablePlans = remember {
            listOf(
                ReadingPlan("chronological_1yr", "Chronological 1-Year Plan", "Complete Genesis through Revelation in historical timeline order", 365),
                ReadingPlan("canonical_365", "Canonical 365-Day Plan", "Read Old and New Testament passages daily in canonical order", 365),
                ReadingPlan("discipleship_90", "Discipleship 90-Day Plan", "Intensive focus on Gospels, Epistles, and Psalms", 90),
                ReadingPlan("nt_30", "New Testament 30-Day Blitz", "Complete New Testament in 30 days", 30)
            )
        }
        val activePlan = availablePlans.find { it.id == activePlanId } ?: availablePlans.first()

        // Initialize Bible Books Checklist Data
        val booksState = remember { mutableStateListOf<BookProgress>().apply { addAll(initialBooksList()) } }
        val secretBooksState = remember { mutableStateListOf<SecretBook>().apply { addAll(initialSecretBooksList()) } }
        val connectionsList = remember { initialConnectionArcs() }

        // Load saved progress if available
        LaunchedEffect(Unit) {
            val savedMap = sessionManager.getSavedProgress()
            if (savedMap.isNotEmpty()) {
                booksState.forEachIndexed { bIdx, book ->
                    savedMap[book.name]?.let { savedStatus ->
                        val updated = MutableList(book.totalChapters) { idx -> savedStatus.getOrElse(idx) { false } }
                        booksState[bIdx] = book.copy(completedChapters = updated)
                    }
                }
            }
        }

        // 3-Day Randomized Calendar Preview State
        var threeDayReadings by remember { mutableStateOf(generateRandom3DayReadings(booksState)) }

        // In-App Update State
        var updateStatusText by remember { mutableStateOf<String?>(null) }
        var isCheckingUpdate by remember { mutableStateOf(false) }

        Scaffold(
            topBar = {
                AppHeader(
                    activeAccount = activeAccount,
                    activePlanName = activePlan.name,
                    onOpenPlanSelector = { showPlanSelector = true },
                    onOpenGeminiSearch = { showGeminiSearch = true },
                    onOpenAuthDialog = { showAuthDialog = true }
                )
            },
            bottomBar = {
                NavigationBar(
                    containerColor = BgDark,
                    contentColor = TextPrimary
                ) {
                    val navItems = listOf(
                        Triple("Plan", Icons.Default.Book, 0),
                        Triple("Graph", Icons.Default.Timeline, 1),
                        Triple("Secret", Icons.Default.Bookmark, 2),
                        Triple("Settings", Icons.Default.Settings, 3)
                    )

                    navItems.forEach { (label, icon, index) ->
                        NavigationBarItem(
                            selected = selectedTab == index,
                            onClick = { selectedTab = index },
                            icon = { Icon(imageVector = icon, contentDescription = label) },
                            label = { Text(text = label, fontSize = 11.sp, fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = AccentGreenBright,
                                selectedTextColor = AccentGreenBright,
                                unselectedIconColor = TextSecondary,
                                unselectedTextColor = TextSecondary,
                                indicatorColor = AccentGreenBright.copy(alpha = 0.15f)
                            )
                        )
                    }
                }
            },
            containerColor = BgDark
        ) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .background(BgDark)
            ) {
                when (selectedTab) {
                    0 -> ReadingPlanScreen(
                        books = booksState,
                        onToggleChapter = { bookId, chapterIdx ->
                            val bIdx = booksState.indexOfFirst { it.id == bookId }
                            if (bIdx != -1) {
                                val book = booksState[bIdx]
                                val newChapters = book.completedChapters.toMutableList()
                                newChapters[chapterIdx] = !newChapters[chapterIdx]
                                booksState[bIdx] = book.copy(completedChapters = newChapters)

                                // Persist
                                val progMap = booksState.associate { it.name to it.completedChapters.toList() }
                                sessionManager.saveProgress(progMap)
                            }
                        }
                    )
                    1 -> GraphScreen(connections = connectionsList)
                    2 -> SecretBooksScreen(
                        secretBooks = secretBooksState,
                        onToggleSecretChapter = { bookId, chapterIdx ->
                            val sIdx = secretBooksState.indexOfFirst { it.id == bookId }
                            if (sIdx != -1) {
                                val sb = secretBooksState[sIdx]
                                val newCh = sb.completedChapters.toMutableList()
                                newCh[chapterIdx] = !newCh[chapterIdx]
                                secretBooksState[sIdx] = sb.copy(completedChapters = newCh)
                            }
                        }
                    )
                    3 -> SettingsScreen(
                        activeAccount = activeAccount,
                        showPlanSelectorOnStartup = showOnStartup,
                        onToggleShowOnStartup = { newVal ->
                            showOnStartup = newVal
                            sessionManager.showPlanSelectorOnStartup = newVal
                        },
                        threeDayReadings = threeDayReadings,
                        onReshuffleCalendar = {
                            threeDayReadings = generateRandom3DayReadings(booksState)
                        },
                        onExportCsv = {
                            val csvContent = CsvManager.exportProgressToCsv(booksState)
                            copyToClipboard(csvContent)
                            Toast.makeText(this@MainActivity, "CSV copied to clipboard & exported!", Toast.LENGTH_SHORT).show()
                        },
                        onImportCsv = { csvText ->
                            val importedMap = CsvManager.parseCsvToProgress(csvText)
                            if (importedMap.isNotEmpty()) {
                                booksState.forEachIndexed { bIdx, book ->
                                    importedMap[book.name]?.let { newStatus ->
                                        val updated = MutableList(book.totalChapters) { idx -> newStatus.getOrElse(idx) { false } }
                                        booksState[bIdx] = book.copy(completedChapters = updated)
                                    }
                                }
                                sessionManager.saveProgress(booksState.associate { it.name to it.completedChapters.toList() })
                                Toast.makeText(this@MainActivity, "Reading progress restored from CSV!", Toast.LENGTH_SHORT).show()
                            }
                        },
                        onCheckForUpdates = {
                            isCheckingUpdate = true
                            scope.launch {
                                val (hasNewer, ver, msg) = apiService.checkForUpdates("Alpha0.0.1")
                                isCheckingUpdate = false
                                updateStatusText = msg
                            }
                        },
                        updateStatusText = updateStatusText,
                        isCheckingUpdate = isCheckingUpdate,
                        sessionToken = sessionToken,
                        onOpenAuthDialog = { showAuthDialog = true }
                    )
                }
            }
        }

        // Dialog overlays
        if (showPlanSelector) {
            PlanSelectorDialog(
                accounts = accounts,
                currentAccountId = activeAccountId,
                availablePlans = availablePlans,
                currentPlanId = activePlanId,
                showOnStartup = showOnStartup,
                onSelectAccountAndPlan = { accId, planId ->
                    activeAccountId = accId
                    sessionManager.activeAccountId = accId
                    activePlanId = planId
                    sessionManager.activePlanId = planId
                },
                onToggleShowOnStartup = { valToggle ->
                    showOnStartup = valToggle
                    sessionManager.showPlanSelectorOnStartup = valToggle
                },
                onAddNewProfile = { name, email ->
                    val newAcc = UserAccount(id = "user_${System.currentTimeMillis()}", name = name, email = email)
                    sessionManager.addAccount(newAcc)
                    accounts.add(newAcc)
                    activeAccountId = newAcc.id
                },
                onDismiss = { showPlanSelector = false }
            )
        }

        if (showGeminiSearch) {
            GeminiSearchDialog(
                apiService = apiService,
                onDismiss = { showGeminiSearch = false }
            )
        }

        if (showAuthDialog) {
            AuthDialog(
                activeAccount = activeAccount,
                apiService = apiService,
                sessionToken = sessionToken,
                onLoginSuccess = { tok ->
                    sessionToken = tok
                    sessionManager.sessionToken = tok
                    Toast.makeText(this@MainActivity, "Google OAuth Sign-In Successful!", Toast.LENGTH_SHORT).show()
                },
                onSignOut = {
                    sessionToken = ""
                    sessionManager.sessionToken = ""
                    Toast.makeText(this@MainActivity, "Signed out.", Toast.LENGTH_SHORT).show()
                },
                onDismiss = { showAuthDialog = false }
            )
        }
    }

    private fun copyToClipboard(text: String) {
        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clip = ClipData.newPlainText("BiblePlanProgress", text)
        clipboard.setPrimaryClip(clip)
    }

    private fun generateRandom3DayReadings(books: List<BookProgress>): List<DailyReading> {
        val otBooks = books.filter { it.category == "Old Testament" }
        val ntBooks = books.filter { it.category == "New Testament" }
        val psBooks = books.filter { it.name == "Psalms" || it.name == "Proverbs" }

        return listOf(1, 2, 3).map { dayNum ->
            val ot = otBooks.randomOrNull()?.let { "${it.name} ${Random.nextInt(1, it.totalChapters + 1)}" } ?: "Genesis 1"
            val nt = ntBooks.randomOrNull()?.let { "${it.name} ${Random.nextInt(1, it.totalChapters + 1)}" } ?: "Matthew 1"
            val ps = psBooks.randomOrNull()?.let { "${it.name} ${Random.nextInt(1, it.totalChapters + 1)}" } ?: "Psalms 23"
            DailyReading(
                dayNumber = dayNum,
                dateLabel = "Day $dayNum Reading",
                passages = listOf(ot, nt, ps)
            )
        }
    }

    private fun initialBooksList(): List<BookProgress> {
        val bList = mutableListOf<BookProgress>()

        fun addB(id: String, name: String, category: String, totalCh: Int) {
            bList.add(
                BookProgress(
                    id = id,
                    name = name,
                    category = category,
                    totalChapters = totalCh,
                    completedChapters = MutableList(totalCh) { false }
                )
            )
        }

        // Old Testament Books
        addB("gen", "Genesis", "Old Testament", 50)
        addB("exo", "Exodus", "Old Testament", 40)
        addB("lev", "Leviticus", "Old Testament", 27)
        addB("num", "Numbers", "Old Testament", 36)
        addB("deu", "Deuteronomy", "Old Testament", 34)
        addB("jos", "Joshua", "Old Testament", 24)
        addB("jdg", "Judges", "Old Testament", 21)
        addB("rut", "Ruth", "Old Testament", 4)
        addB("1sa", "1 Samuel", "Old Testament", 31)
        addB("2sa", "2 Samuel", "Old Testament", 24)
        addB("1ki", "1 Kings", "Old Testament", 22)
        addB("2ki", "2 Kings", "Old Testament", 25)
        addB("1ch", "1 Chronicles", "Old Testament", 29)
        addB("2ch", "2 Chronicles", "Old Testament", 36)
        addB("ezr", "Ezra", "Old Testament", 10)
        addB("neh", "Nehemiah", "Old Testament", 13)
        addB("est", "Esther", "Old Testament", 10)
        addB("job", "Job", "Old Testament", 42)
        addB("psa", "Psalms", "Old Testament", 150)
        addB("pro", "Proverbs", "Old Testament", 31)
        addB("ecc", "Ecclesiastes", "Old Testament", 12)
        addB("sng", "Song of Solomon", "Old Testament", 8)
        addB("isa", "Isaiah", "Old Testament", 66)
        addB("jer", "Jeremiah", "Old Testament", 52)
        addB("lam", "Lamentations", "Old Testament", 5)
        addB("ezk", "Ezekiel", "Old Testament", 48)
        addB("dan", "Daniel", "Old Testament", 12)
        addB("hos", "Hosea", "Old Testament", 14)
        addB("jol", "Joel", "Old Testament", 3)
        addB("amo", "Amos", "Old Testament", 9)
        addB("oba", "Obadiah", "Old Testament", 1)
        addB("jon", "Jonah", "Old Testament", 4)
        addB("mic", "Micah", "Old Testament", 7)
        addB("nam", "Nahum", "Old Testament", 3)
        addB("hab", "Habakkuk", "Old Testament", 3)
        addB("zep", "Zephaniah", "Old Testament", 3)
        addB("hag", "Haggai", "Old Testament", 2)
        addB("zec", "Zechariah", "Old Testament", 14)
        addB("mal", "Malachi", "Old Testament", 4)

        // New Testament Books
        addB("mat", "Matthew", "New Testament", 28)
        addB("mrk", "Mark", "New Testament", 16)
        addB("luk", "Luke", "New Testament", 24)
        addB("jhn", "John", "New Testament", 21)
        addB("act", "Acts", "New Testament", 28)
        addB("rom", "Romans", "New Testament", 16)
        addB("1co", "1 Corinthians", "New Testament", 16)
        addB("2co", "2 Corinthians", "New Testament", 13)
        addB("gal", "Galatians", "New Testament", 6)
        addB("eph", "Ephesians", "New Testament", 6)
        addB("php", "Philippians", "New Testament", 4)
        addB("col", "Colossians", "New Testament", 4)
        addB("1th", "1 Thessalonians", "New Testament", 5)
        addB("2th", "2 Thessalonians", "New Testament", 3)
        addB("1ti", "1 Timothy", "New Testament", 6)
        addB("2ti", "2 Timothy", "New Testament", 4)
        addB("tit", "Titus", "New Testament", 3)
        addB("phm", "Philemon", "New Testament", 1)
        addB("heb", "Hebrews", "New Testament", 13)
        addB("jas", "James", "New Testament", 5)
        addB("1pe", "1 Peter", "New Testament", 5)
        addB("2pe", "2 Peter", "New Testament", 3)
        addB("1jn", "1 John", "New Testament", 5)
        addB("2jn", "2 John", "New Testament", 1)
        addB("3jn", "3 John", "New Testament", 1)
        addB("jud", "Jude", "New Testament", 1)
        addB("rev", "Revelation", "New Testament", 22)

        return bList
    }

    private fun initialSecretBooksList(): List<SecretBook> {
        return listOf(
            SecretBook("enoch", "Book of Enoch", "First Enoch / Ethiopian Enoch", "Pseudepigrapha", "Ancient apocalyptic tradition attributed to Enoch, great-grandfather of Noah.", 108),
            SecretBook("jubilees", "Book of Jubilees", "The Lesser Genesis", "Pseudepigrapha", "Detailed chronicle of secret revelations given to Moses at Mount Sinai.", 50),
            SecretBook("tobit", "Book of Tobit", "Book of Tobias", "Deuterocanonical", "Story of righteous Tobit, Sarah, and Raphael the Archangel.", 14),
            SecretBook("judith", "Book of Judith", "Judith's Deliverance", "Deuterocanonical", "Account of Judith of Bethulia who saved Israel from Holofernes.", 16),
            SecretBook("wisdom", "Wisdom of Solomon", "The Book of Wisdom", "Deuterocanonical", "Poetic Hellenistic Jewish work on divine wisdom and immortality.", 19),
            SecretBook("sirach", "Wisdom of Sirach", "Ecclesiasticus", "Deuterocanonical", "Comprehensive guide to moral living and Jewish ethical wisdom.", 51),
            SecretBook("baruch", "Book of Baruch", "Prophecy of Baruch", "Deuterocanonical", "Work attributed to Baruch ben Neriah, scribe of Jeremiah.", 6),
            SecretBook("1macc", "1 Maccabees", "First Book of Maccabees", "Deuterocanonical", "Historical account of the Maccabean Revolt and Hanukkah history.", 16),
            SecretBook("2macc", "2 Maccabees", "Second Book of Maccabees", "Deuterocanonical", "Focuses on the martyrdoms and the victory of Judas Maccabeus.", 15),
            SecretBook("psalm151", "Psalm 151", "David's Additional Psalm", "Apocrypha", "Short psalm celebrating David's victory over Goliath.", 1)
        )
    }

    private fun initialConnectionArcs(): List<ConnectionArc> {
        return listOf(
            ConnectionArc("c1", "Isaiah", 53, "Matthew", 27, "Suffering Servant Pierced for Transgressions", "Prophecy"),
            ConnectionArc("c2", "Micah", 5, "Luke", 2, "Messiah Born in Bethlehem Ephrathah", "Messianic"),
            ConnectionArc("c3", "Psalms", 22, "John", 19, "Dividing Garments & Casting Lots", "Prophecy"),
            ConnectionArc("c4", "Genesis", 3, "Revelation", 22, "Tree of Life Restored in New Jerusalem", "Type/Antitype"),
            ConnectionArc("c5", "Exodus", 12, "1 Corinthians", 5, "Christ Our Passover Lamb Sacrificed", "Parallel"),
            ConnectionArc("c6", "Zechariah", 9, "Matthew", 21, "King Riding Lowly on a Donkey", "Messianic"),
            ConnectionArc("c7", "Malachi", 3, "Mark", 1, "Messenger Preparing the Way in the Wilderness", "Prophecy")
        )
    }
}
