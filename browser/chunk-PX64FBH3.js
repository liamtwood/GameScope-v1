import{b as P}from"./chunk-SE476KAQ.js";import{a as v}from"./chunk-UENTKBOB.js";import{a as S}from"./chunk-EPXFOHCE.js";import{ha as E}from"./chunk-FYUZJDUE.js";import{V as o,a as C,c as I,m as f}from"./chunk-7MQ6R67W.js";import{J as l,a as h,ca as p,g as u,ga as y,la as c,n as d,t as a,w as b}from"./chunk-VB2HW2GK.js";var U=class m{constructor(e,r,n,i,t,s){this.http=e;this.router=r;this.snackBar=n;this.rbacService=i;this.clubSelectionService=t;this.teamSelectionService=s}TOKEN_KEY="token";USER_KEY="user";httpOptions={headers:new C({"Content-Type":"application/json",Accept:"application/json"})};isLoggedInSubject=new d(this.hasValidToken());isLoggedIn$=this.isLoggedInSubject.asObservable();currentUserSubject=new d(this.loadUserFromStorage());currentUser$=this.currentUserSubject.asObservable();setSession(e){let r={Id:e.Id,MemberKey:e.MemberKey||e.Id,ParentClubKey:e.ParentClubKey,ClubKey:e.ClubKey,PostGresId:e.PostGresId||e.Id,ParentclubId:e.ParentclubId,ClubId:e.ClubId,Token:e.Token,UserProfileDetails:{FirstName:e.UserProfileDetails?.FirstName||"string",LastName:e.UserProfileDetails?.LastName||"string",EmailID:e.UserProfileDetails?.EmailID||"",Gender:e.UserProfileDetails?.Gender||"string",DOB:e.UserProfileDetails?.DOB||"string",IsEnable:e.UserProfileDetails?.IsEnable??!0}};localStorage.setItem(this.TOKEN_KEY,r.Token),localStorage.setItem(this.USER_KEY,JSON.stringify(r)),this.currentUserSubject.next(r),this.isLoggedInSubject.next(!0)}getToken(){return localStorage.getItem(this.TOKEN_KEY)}getCurrentUser(){return this.currentUserSubject.value}isLoggedIn(){let e=this.isLoggedInSubject.value;if(e){let r=null;this.rbacService.contract$.subscribe(n=>r=n),r||this.rbacService.fetchVisibilityContract().subscribe()}return e}logout(){localStorage.removeItem(this.TOKEN_KEY),localStorage.removeItem(this.USER_KEY),this.clubSelectionService.clearSelectedClub(),this.teamSelectionService.clearSelectedTeam(),this.currentUserSubject.next(null),this.isLoggedInSubject.next(!1),this.rbacService.clearContract(),this.showToast("You have been logged out",!1),this.router.navigate(["/auth/login"])}showToast(e,r=!1,n=3e3){this.snackBar.open(e,"Close",{duration:n,panelClass:r?["error-snackbar"]:["success-snackbar"]})}login(e,r,n){if(n==="staff"){let i={email:e,password:r,parentClubId:"",parentClubKey:""};return console.log("Sending admin login request to:",o.adminLogin),this.http.post(o.adminLogin,i,this.httpOptions).pipe(p(t=>{if(!t||!t.success||!t.token)throw new Error(t?.message||"Invalid response from server");this.handleLoginResponse(t,"staff")}),l(t=>{let s=t.error?.error?.message||t.error?.message||t.message||"Login failed. Please check your credentials.",g=s.includes("Invite pending");g||(console.error("\u274C Admin login error:",t),this.showToast(s,!0));let T={originalError:t,message:s,isInvitePending:g};return a(()=>T)}))}else{let i={UserID:e,Password:r,ParentClubId:""};return console.log("Sending member login request to:",o.login),this.http.post(o.login,i,this.httpOptions).pipe(p(t=>{if(!t||!t.success||!t.data?.Token)throw new Error(t?.message||"Invalid response from server");this.handleLoginResponse(t,"member")}),l(t=>{console.error("\u274C Member login error:",t);let s=t.error?.message||t.message||"Login failed. Please check your credentials.";return this.showToast(s,!0),a(()=>new Error(s))}))}}handleLoginResponse(e,r){let n="",i;if(r==="staff"){let t=e.user;if(n=e.token,i={Id:t.id,MemberKey:t.id,ParentClubKey:t.parentClubKey,ClubKey:"",PostGresId:t.id,ParentclubId:t.parentClubId,ClubId:"",Token:n,UserProfileDetails:{FirstName:t.name||"Admin User",LastName:"",EmailID:t.email,Gender:"string",DOB:"string",IsEnable:!0}},e.parentClub){let s=e.parentClub,g={id:s.id,name:s.name,logoUrl:s.logoUrl,firebaseId:s.firebaseId,shortName:s.shortName||s.raw?.short_name||s.name.substring(0,2).toUpperCase(),owner:s.owner||s.contactName||"",subscriptionStatus:s.subscriptionStatus||(s.parentclubStatus===1?"active":"inactive"),country:s.country||"",phone:s.phone||s.contactPhone||"",email:s.email||s.adminEmail||"",colors:s.colors||{primary:s.primaryColor||"#dc2626",secondary:s.secondaryColor||"#000000"},stats:s.stats||{players:0,teams:0,fixtures:0},contactName:s.contactName||"",activeTeamsCount:s.activeTeamsCount||"0",activeMatchesCount:s.activeMatchesCount||"0",userCount:s.userCount||"0",clubs:s.clubs||[{club_id:s.id,club_name:s.name,is_active:!0}],contactPhone:s.contactPhone||"",corporateAddressFirstline:s.corporateAddressFirstline||"",corporateAddressSecondline:s.corporateAddressSecondline||"",corporateAddressCity:s.corporateAddressCity||"",corporateAddressState:s.corporateAddressState||"",countryName:s.countryName||"",postcode:s.postcode||"",adminEmail:s.adminEmail||"",primaryColor:s.primaryColor||"#dc2626",secondaryColor:s.secondaryColor||"#000000",parentclubStatus:s.parentclubStatus!==void 0?s.parentclubStatus:1};this.clubSelectionService.setSelectedClub(g)}this.teamSelectionService.clearSelectedTeam()}else{let t=e.data;n=t.Token,i={Id:t.Id,MemberKey:t.MemberKey||t.Id,ParentClubKey:t.ParentClubKey,ClubKey:t.ClubKey,PostGresId:t.PostGresId||t.Id,ParentclubId:t.ParentclubId||t.ParentClubId,ClubId:t.ClubId,Token:n,UserProfileDetails:{FirstName:"string",LastName:"string",EmailID:t.EmailID,Gender:"string",DOB:"string",IsEnable:!0}}}localStorage.setItem(this.TOKEN_KEY,n),localStorage.setItem(this.USER_KEY,JSON.stringify(i)),this.currentUserSubject.next(i),this.isLoggedInSubject.next(!0),this.rbacService.fetchVisibilityContract().subscribe(),this.showToast("Login successful!",!1)}getAdminProfile(){return this.http.get(o.adminProfile,this.httpOptions).pipe(l(e=>{console.error("\u274C Get admin profile error:",e);let r=e.error?.message||e.message||"Failed to fetch admin profile";return this.showToast(r,!0),a(()=>new Error(r))}))}updateAdminProfile(e){return this.http.put(o.adminProfile,e).pipe(l(r=>{console.error("\u274C Update admin profile error:",r);let n=r.error?.message||r.message||"Failed to update admin profile";return this.showToast(n,!0),a(()=>new Error(n))}))}updateLocalUserData(e){let r=this.currentUserSubject.value;if(r){if(r.UserProfileDetails||(r.UserProfileDetails={FirstName:"",LastName:"",EmailID:"",Gender:"",DOB:"",IsEnable:!0}),e.name){let n=e.name.trim().split(/\s+/);r.UserProfileDetails.FirstName=n[0]||"",r.UserProfileDetails.LastName=n.slice(1).join(" ")||""}e.email&&(r.UserProfileDetails.EmailID=e.email),localStorage.setItem(this.USER_KEY,JSON.stringify(r)),this.currentUserSubject.next(h({},r))}}changeAdminPassword(e,r){let n={currentPassword:e,newPassword:r};return this.http.post(o.adminChangePassword,n,this.httpOptions).pipe(l(i=>{console.error("\u274C Change password error:",i);let t=i.error?.message||i.message||"Failed to change password";return this.showToast(t,!0),a(()=>new Error(t))}))}getParentClubSetup(e){return u(this,null,function*(){let r=`
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
    `;try{return(yield this.executeGraphQLQuery(r)).data.getParentClubSetup}catch(n){throw console.error("Error fetching parent club setup:",n),new Error("Failed to fetch parent club setup")}})}checkUserEmailExistance(e,r){return u(this,null,function*(){let n=`
      query {
        checkUserEmailExistance(parentClubId: "${e}", email: "${r}")
      }
    `;try{return(yield this.executeGraphQLQuery(n)).data.checkUserEmailExistance}catch(i){throw console.error("Error checking email existence:",i),new Error("Failed to check email availability")}})}registerVenueUser(e){return u(this,null,function*(){try{let r=this.http.post(o.registerVenueUser,e,this.httpOptions),n=yield b(r);return console.log("\u2713 User registered successfully:",n),n}catch(r){console.error("\u274C Error registering user:",r);let n="Failed to register user";throw r.status===409?n="User with this email already exists":r.status===400?n="Invalid user data provided":r.status===401||r.status===403?n="Unauthorized to register":r.error?.message&&(n=r.error.message),new Error(n)}})}validateInviteToken(e){return this.http.get(`${o.validateAdminInvite}?token=${encodeURIComponent(e)}`).pipe(l(r=>{let n=r.error?.message||r.message||"Failed to validate invite token";return a(()=>new Error(n))}))}setPasswordFromInvite(e,r){return this.http.post(o.setAdminInvitePassword,{token:e,newPassword:r},this.httpOptions).pipe(l(n=>{let i=n.error?.message||n.message||"Failed to set password. Please try again.";return a(()=>new Error(i))}))}executeGraphQLQuery(e){return u(this,null,function*(){let r={query:e};try{let n=this.http.post(o.GRAPHQL,r,this.httpOptions),i=yield b(n);if(i.errors&&i.errors.length>0){let t=i.errors.map(s=>s.message).join(", ");throw new Error(`GraphQL Error: ${t}`)}return i}catch(n){if(n.error&&n.error.errors){let i=n.error.errors.map(t=>t.message).join(", ");throw new Error(`GraphQL Error: ${i}`)}throw n.message?n:new Error("Network error occurred while making request")}})}hasValidToken(){let e=localStorage.getItem(this.TOKEN_KEY),r=localStorage.getItem(this.USER_KEY);if(!e||!r)return!1;try{return!!JSON.parse(r)?.Token}catch{return!1}}loadUserFromStorage(){try{let e=localStorage.getItem(this.USER_KEY);return e?JSON.parse(e):null}catch{return null}}static \u0275fac=function(r){return new(r||m)(c(I),c(f),c(S),c(P),c(E),c(v))};static \u0275prov=y({token:m,factory:m.\u0275fac,providedIn:"root"})};export{U as a};
