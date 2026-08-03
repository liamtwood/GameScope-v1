import{a as T}from"./chunk-UENTKBOB.js";import{b as v}from"./chunk-SE476KAQ.js";import{a as P}from"./chunk-EPXFOHCE.js";import{ha as U}from"./chunk-FYUZJDUE.js";import{V as a,a as y,c as f,m as E}from"./chunk-7MQ6R67W.js";import{J as c,a as d,b as C,ca as h,g,ga as I,la as u,n as b,t as l,w as p}from"./chunk-VB2HW2GK.js";var w=class m{constructor(e,t,r,i,n,o){this.http=e;this.router=t;this.snackBar=r;this.rbacService=i;this.clubSelectionService=n;this.teamSelectionService=o;this.clubSelectionService.selectedClub$.subscribe(s=>this.rememberSelection("club",s)),this.teamSelectionService.selectedTeam$.subscribe(s=>this.rememberSelection("team",s))}TOKEN_KEY="token";USER_KEY="user";LAST_SELECTION_KEY="gs_last_selection";httpOptions={headers:new y({"Content-Type":"application/json",Accept:"application/json"})};isLoggedInSubject=new b(this.hasValidToken());isLoggedIn$=this.isLoggedInSubject.asObservable();currentUserSubject=new b(this.loadUserFromStorage());currentUser$=this.currentUserSubject.asObservable();setSession(e){let t={Id:e.Id,MemberKey:e.MemberKey||e.Id,ParentClubKey:e.ParentClubKey,ClubKey:e.ClubKey,PostGresId:e.PostGresId||e.Id,ParentclubId:e.ParentclubId,ClubId:e.ClubId,Token:e.Token,UserProfileDetails:{FirstName:e.UserProfileDetails?.FirstName||"string",LastName:e.UserProfileDetails?.LastName||"string",EmailID:e.UserProfileDetails?.EmailID||"",Gender:e.UserProfileDetails?.Gender||"string",DOB:e.UserProfileDetails?.DOB||"string",IsEnable:e.UserProfileDetails?.IsEnable??!0}};localStorage.setItem(this.TOKEN_KEY,t.Token),localStorage.setItem(this.USER_KEY,JSON.stringify(t)),this.currentUserSubject.next(t),this.isLoggedInSubject.next(!0)}getToken(){return localStorage.getItem(this.TOKEN_KEY)}getCurrentUser(){return this.currentUserSubject.value}isLoggedIn(){let e=this.isLoggedInSubject.value;if(e){let t=null;this.rbacService.contract$.subscribe(r=>t=r),t||this.rbacService.fetchVisibilityContract().subscribe()}return e}logout(){localStorage.removeItem(this.TOKEN_KEY),localStorage.removeItem(this.USER_KEY),this.clubSelectionService.clearSelectedClub(),this.teamSelectionService.clearSelectedTeam(),this.currentUserSubject.next(null),this.isLoggedInSubject.next(!1),this.rbacService.clearContract(),this.showToast("You have been logged out",!1),this.router.navigate(["/auth/login"])}showToast(e,t=!1,r=3e3){this.snackBar.open(e,"Close",{duration:r,panelClass:t?["error-snackbar"]:["success-snackbar"]})}login(e,t,r){if(r==="staff"){let i={email:e,password:t,parentClubId:"",parentClubKey:""};return console.log("Sending admin login request to:",a.adminLogin),this.http.post(a.adminLogin,i,this.httpOptions).pipe(h(n=>{if(!n||!n.success||!n.token)throw new Error(n?.message||"Invalid response from server");this.handleLoginResponse(n,"staff")}),c(n=>{let o=n.error?.error?.message||n.error?.message||n.message||"Login failed. Please check your credentials.",s=o.includes("Invite pending");s||(console.error("\u274C Admin login error:",n),this.showToast(o,!0));let S={originalError:n,message:o,isInvitePending:s};return l(()=>S)}))}else{let i={UserID:e,Password:t,ParentClubId:""};return console.log("Sending member login request to:",a.login),this.http.post(a.login,i,this.httpOptions).pipe(h(n=>{if(!n||!n.success||!n.data?.Token)throw new Error(n?.message||"Invalid response from server");this.handleLoginResponse(n,"member")}),c(n=>{console.error("\u274C Member login error:",n);let o=n.error?.message||n.message||"Login failed. Please check your credentials.";return this.showToast(o,!0),l(()=>new Error(o))}))}}handleLoginResponse(e,t){let r="",i,n=null;if(t==="staff"){let o=e.user;if(r=e.token,i={Id:o.id,MemberKey:o.id,ParentClubKey:o.parentClubKey,ClubKey:"",PostGresId:o.id,ParentclubId:o.parentClubId,ClubId:"",Token:r,UserProfileDetails:{FirstName:o.name||"Admin User",LastName:"",EmailID:o.email,Gender:"string",DOB:"string",IsEnable:!0}},e.parentClub){let s=e.parentClub;n={id:s.id,name:s.name,logoUrl:s.logoUrl,firebaseId:s.firebaseId,shortName:s.shortName||s.raw?.short_name||s.name.substring(0,2).toUpperCase(),owner:s.owner||s.contactName||"",subscriptionStatus:s.subscriptionStatus||(s.parentclubStatus===1?"active":"inactive"),country:s.country||"",phone:s.phone||s.contactPhone||"",email:s.email||s.adminEmail||"",colors:s.colors||{primary:s.primaryColor||"#dc2626",secondary:s.secondaryColor||"#000000"},stats:s.stats||{players:0,teams:0,fixtures:0},contactName:s.contactName||"",activeTeamsCount:s.activeTeamsCount||"0",activeMatchesCount:s.activeMatchesCount||"0",userCount:s.userCount||"0",clubs:s.clubs||[{club_id:s.id,club_name:s.name,is_active:!0}],contactPhone:s.contactPhone||"",corporateAddressFirstline:s.corporateAddressFirstline||"",corporateAddressSecondline:s.corporateAddressSecondline||"",corporateAddressCity:s.corporateAddressCity||"",corporateAddressState:s.corporateAddressState||"",countryName:s.countryName||"",postcode:s.postcode||"",adminEmail:s.adminEmail||"",primaryColor:s.primaryColor||"#dc2626",secondaryColor:s.secondaryColor||"#000000",parentclubStatus:s.parentclubStatus!==void 0?s.parentclubStatus:1}}}else{let o=e.data;r=o.Token,i={Id:o.Id,MemberKey:o.MemberKey||o.Id,ParentClubKey:o.ParentClubKey,ClubKey:o.ClubKey,PostGresId:o.PostGresId||o.Id,ParentclubId:o.ParentclubId||o.ParentClubId,ClubId:o.ClubId,Token:r,UserProfileDetails:{FirstName:"string",LastName:"string",EmailID:o.EmailID,Gender:"string",DOB:"string",IsEnable:!0}}}localStorage.setItem(this.TOKEN_KEY,r),localStorage.setItem(this.USER_KEY,JSON.stringify(i)),this.currentUserSubject.next(i),this.isLoggedInSubject.next(!0),n&&this.clubSelectionService.setSelectedClub(n),this.restoreLastSelection(i.Id),this.rbacService.fetchVisibilityContract().subscribe(),this.showToast("Login successful!",!1)}getAdminProfile(){return this.http.get(a.adminProfile,this.httpOptions).pipe(c(e=>{console.error("\u274C Get admin profile error:",e);let t=e.error?.message||e.message||"Failed to fetch admin profile";return this.showToast(t,!0),l(()=>new Error(t))}))}updateAdminProfile(e){return this.http.put(a.adminProfile,e).pipe(c(t=>{console.error("\u274C Update admin profile error:",t);let r=t.error?.message||t.message||"Failed to update admin profile";return this.showToast(r,!0),l(()=>new Error(r))}))}updateLocalUserData(e){let t=this.currentUserSubject.value;if(t){if(t.UserProfileDetails||(t.UserProfileDetails={FirstName:"",LastName:"",EmailID:"",Gender:"",DOB:"",IsEnable:!0}),e.name){let r=e.name.trim().split(/\s+/);t.UserProfileDetails.FirstName=r[0]||"",t.UserProfileDetails.LastName=r.slice(1).join(" ")||""}e.email&&(t.UserProfileDetails.EmailID=e.email),localStorage.setItem(this.USER_KEY,JSON.stringify(t)),this.currentUserSubject.next(d({},t))}}changeAdminPassword(e,t){let r={currentPassword:e,newPassword:t};return this.http.post(a.adminChangePassword,r,this.httpOptions).pipe(c(i=>{console.error("\u274C Change password error:",i);let n=i.error?.message||i.message||"Failed to change password";return this.showToast(n,!0),l(()=>new Error(n))}))}getParentClubSetup(e){return g(this,null,function*(){let t=`
      query {
        getParentClubSetup(parentclubId: "${e}") {
          ParentClubName
          ParentClubAdminEmailID
          ParentClubAppIconURL
          ParentClubAddress
          PostCode
          CopyRight
          SignUpType
          ContactNo
          Home_Photo_Consent
          Home_Video_Consent
          Website
          IsChatEnable
          IsWalletEnabled
          LandingPageImageURL
          TermUrl
          CurrentVersion
          ParentClubCurrency {
            CurrencyCode
            CurrencyName
            CurrencySymbol
            CurrencyCountry
          }
          DashboardView {
            ActiveBookings
            Coach
            FacilityBookings
            showAddFamily
            Family
            SessionCount
          }
          Theme {
            TabBG
            TabText
            HeaderText
            HeaderBG
          }
          TermsNConditions {
            Button1Text
            Button2Text
            ContentUrl
            LegalNotificationText
            Title
            termsType
          }
          Reg_Types {
            Key
            Label
            Value
          }
        }
      }
    `;try{return(yield this.executeGraphQLQuery(t)).data.getParentClubSetup}catch(r){throw console.error("Error fetching parent club setup:",r),new Error("Failed to fetch parent club setup")}})}checkUserEmailExistance(e,t){return g(this,null,function*(){let r=`
      query {
        checkUserEmailExistance(parentClubId: "${e}", email: "${t}")
      }
    `;try{return(yield this.executeGraphQLQuery(r)).data.checkUserEmailExistance}catch(i){throw console.error("Error checking email existence:",i),new Error("Failed to check email availability")}})}registerVenueUser(e){return g(this,null,function*(){try{let t=this.http.post(a.registerVenueUser,e,this.httpOptions),r=yield p(t);return console.log("\u2713 User registered successfully:",r),r}catch(t){console.error("\u274C Error registering user:",t);let r="Failed to register user";throw t.status===409?r="User with this email already exists":t.status===400?r="Invalid user data provided":t.status===401||t.status===403?r="Unauthorized to register":t.error?.message&&(r=t.error.message),new Error(r)}})}validateInviteToken(e){return this.http.get(`${a.validateAdminInvite}?token=${encodeURIComponent(e)}`).pipe(c(t=>{let r=t.error?.message||t.message||"Failed to validate invite token";return l(()=>new Error(r))}))}setPasswordFromInvite(e,t){return this.http.post(a.setAdminInvitePassword,{token:e,newPassword:t},this.httpOptions).pipe(c(r=>{let i=r.error?.message||r.message||"Failed to set password. Please try again.";return l(()=>new Error(i))}))}executeGraphQLQuery(e){return g(this,null,function*(){let t={query:e};try{let r=this.http.post(a.GRAPHQL,t,this.httpOptions),i=yield p(r);if(i.errors&&i.errors.length>0){let n=i.errors.map(o=>o.message).join(", ");throw new Error(`GraphQL Error: ${n}`)}return i}catch(r){if(r.error&&r.error.errors){let i=r.error.errors.map(n=>n.message).join(", ");throw new Error(`GraphQL Error: ${i}`)}throw r.message?r:new Error("Network error occurred while making request")}})}hasValidToken(){let e=localStorage.getItem(this.TOKEN_KEY),t=localStorage.getItem(this.USER_KEY);if(!e||!t)return!1;try{return!!JSON.parse(t)?.Token}catch{return!1}}rememberSelection(e,t){if(!t)return;let r=this.currentUserSubject.value?.Id;if(r)try{let i=JSON.parse(localStorage.getItem(this.LAST_SELECTION_KEY)||"{}");i[r]=C(d({},i[r]||{}),{[e]:t}),localStorage.setItem(this.LAST_SELECTION_KEY,JSON.stringify(i))}catch{}}getLastSelection(e){try{return JSON.parse(localStorage.getItem(this.LAST_SELECTION_KEY)||"{}")[e]||{}}catch{return{}}}restoreLastSelection(e){let t=this.getLastSelection(e);t.club&&this.clubSelectionService.setSelectedClub(t.club),t.team&&this.teamSelectionService.setSelectedTeam(t.team)}loadUserFromStorage(){try{let e=localStorage.getItem(this.USER_KEY);return e?JSON.parse(e):null}catch{return null}}static \u0275fac=function(t){return new(t||m)(u(f),u(E),u(P),u(v),u(U),u(T))};static \u0275prov=I({token:m,factory:m.\u0275fac,providedIn:"root"})};export{w as a};
