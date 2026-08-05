import{V as m,a as b,c}from"./chunk-XZ6SCRAC.js";import{J as i,V as p,ga as y,la as g,t as d,x as o,y as n}from"./chunk-6A6ONQ4E.js";var C=(t=>(t[t.INACTIVE=0]="INACTIVE",t[t.ACTIVE=1]="ACTIVE",t[t.SUSPENDED=2]="SUSPENDED",t[t.ARCHIVED=3]="ARCHIVED",t))(C||{});var v=(r=>(r[r.PLAYER=1]="PLAYER",r[r.COACH=2]="COACH",r[r.MANAGER=3]="MANAGER",r))(v||{});var I={UserAppType:20,UserActionType:0,UserDeviceType:3},P=(r=>(r[r.MALE=1]="MALE",r[r.FEMALE=2]="FEMALE",r[r.MIXED=3]="MIXED",r))(P||{});var _=class u{constructor(e){this.http=e}apiUrl=m.GRAPHQL;httpOptions={headers:new b({"Content-Type":"application/json"})};updateLeagueFixture(e){return this.http.post(m.updateLeagueFixture,e,{headers:this.getHeaders()}).pipe(o(3e4),p(1),i(this.handleError))}getVenuesByParentClub(e){let r={query:`
      query getVenuesByParentClub($clubs_input: ParentClubVenuesInput!) {
        getVenuesByParentClub(clubInput: $clubs_input) {
          Id
          ClubName
          FirebaseId
          MapUrl
          sequence
        }
      }
    `,variables:{clubs_input:{user_postgre_metadata:{UserParentClubId:e.user_postgre_metadata.UserParentClubId,UserClubId:e.user_postgre_metadata.UserClubId||"",UserMemberId:e.user_postgre_metadata.UserMemberId||"",UserActivityId:e.user_postgre_metadata.UserActivityId||""},parentclub_id:e.parentclub_id}}};return this.http.post(this.apiUrl,r,this.httpOptions).pipe(n(t=>{if(t.errors)throw new Error(t.errors[0].message);return t.data.getVenuesByParentClub}),i(this.handleError))}getClubActivities(e){return this.http.post(m.getClubActivities,e,{headers:this.getHeaders()}).pipe(o(3e4),p(1),i(this.handleError))}getHeaders(){return new b({"Content-Type":"application/json"})}getTeamsForParentClub(e){let r={query:`
  query GetTeamsForParentClub($teamDetails: ParentClubTeamFetchInput!) {
    getTeamsForParentClub(TeamDetails: $teamDetails) {
      id
      created_at
      created_by
      updated_at
      is_active
      activity {
        ActivityName
        ActivityCode
        __typename
      }
      venueKey
      short_name
      venueType
      ageGroup
      teamName
      teamStatus
      teamVisibility
      team_type
      parentClub {
        FireBaseId
        __typename
      }
      club {
        Id
        ClubName
        FirebaseId
        __typename
      }
      __typename
    }
  }
`,variables:{teamDetails:{user_postgre_metadata:{UserParentClubId:e.id},user_device_metadata:I}}};return this.http.post(this.apiUrl,r,this.httpOptions).pipe(n(t=>{if(t.errors)throw new Error(t.errors[0].message);return t.data.getTeamsForParentClub}),i(this.handleError))}getTeamById(e){let r={query:`
      query getTeamsById($teamId: String!) {
        getTeamsById(teamId: $teamId) {
          id
          created_at
          created_by
          updated_at
          is_active
          activity {
            ActivityName
            ActivityCode
            __typename
          }
          venueKey
          venueType
          ageGroup
          teamName
          teamStatus
          teamVisibility
          parentClub {
            FireBaseId
            __typename
          }
          club {
            Id
            ClubName
            FirebaseId
            __typename
          }
          __typename
        }
      }
    `,variables:{teamId:e}};return this.http.post(this.apiUrl,r,this.httpOptions).pipe(n(t=>{if(t.errors)throw new Error(t.errors[0].message);return t.data.getTeamsById}),i(this.handleError))}getAllMembersByParentClub(e,a="",r="",t=0){let h={query:`
    query getAllMembersByParentClubNMemberType(
      $parentclub_id: String!,
      $club_id: String!,
      $search_term: String!,
      $member_type: Int!,
      $limit: Int!,
      $offset: Int!
    ) {
      getAllMembersByParentClubNMemberType(
        userInput: {
          parentclub_id: $parentclub_id,
          club_id: $club_id,
          search_term: $search_term,
          member_type: $member_type,
          limit: $limit,
          offset: $offset
        }
      ) {
        Id
        FirebaseKey
        FirstName
        LastName
        ClubKey
        IsChild
        DOB
        EmailID
        EmergencyContactName
        EmergencyNumber
        Gender
        MedicalCondition
        ParentClubKey
        ParentKey
        PhoneNumber
        IsEnable
        IsActive
        PromoEmailAllowed
      }
    }
  `,variables:{parentclub_id:e,club_id:a,search_term:r,member_type:1,limit:0,offset:t}};return this.http.post(this.apiUrl,h,this.httpOptions).pipe(n(l=>{if(l.errors)throw new Error(l.errors[0].message);return l.data.getAllMembersByParentClubNMemberType}),i(this.handleError))}getTeamRoles(e,a){let t={query:`
    query getTeamRoles(
      $ParentClubKey: String!,
      $MemberKey: String!,
      $AppType: Int!,
      $ActionType: Int!,
      $activityCode: Int!
    ) {
      getTeamRoles(
        activityDetails: {
          ParentClubKey: $ParentClubKey
          MemberKey: $MemberKey
          AppType: $AppType
          ActionType: $ActionType
          activityCode: $activityCode
        }
      ) {
        teamRoles {
          id
          created_at
          created_by
          updated_at
          is_active
          role_type
          role_name
          role_description
        }
        staffRoles {
          id
          created_at
          created_by
          updated_at
          is_active
          role_type
          role_name
          role_description
        }
      }
    }
  `,variables:{ParentClubKey:"",MemberKey:"",AppType:20,ActionType:0,activityCode:1002}};return this.http.post(this.apiUrl,t,this.httpOptions).pipe(n(s=>{if(s.errors)throw new Error(s.errors[0].message);return s.data.getTeamRoles}),i(this.handleError))}updatePlayerRoleInTeam(e){let r={query:`
    mutation updatePlayerRoleInTeam(
      $playerTeamId: String!,
      $roleId: String!
    ) {
      updatePlayerRoleInTeam(
        teamMemberRoleUpdate: {
          playerTeamId: $playerTeamId
          roleId: $roleId
        }
      )
    }
  `,variables:{playerTeamId:e.playerTeamId,roleId:e.roleId}};return this.http.post(this.apiUrl,r,this.httpOptions).pipe(n(t=>{if(t.errors)throw new Error(t.errors[0].message);return t.data.updatePlayerRoleInTeam}),i(this.handleError))}getParentClubTeamMembers(e,a){let t={query:`
      query getParentClubTeamMembers($teamId: String!, $roleType: Int!) {
        getParentClubTeamMembers(teamId: $teamId, roleType: $roleType) {
          id
          user {
            Id
            FirstName
            LastName
            Gender
            DOB
            FirebaseKey
            EmailID
            is_child
            parent_key
            __typename
          }
          teamrole {
            role_type
            role_name
            role_description
            __typename
          }
          __typename
        }
      }
    `,variables:{teamId:e,roleType:a}};return this.http.post(this.apiUrl,t,this.httpOptions).pipe(n(s=>{if(s.errors)throw new Error(s.errors[0].message);return s.data.getParentClubTeamMembers}),i(this.handleError))}createTeam(e){let r={query:`
    mutation createTeamForParentClub(
      $userParentClubId: String!,
      $activityCode: String!,
      $venueKey: String!,
      $ageGroup: String!,
      $teamName: String!,
      $shortName: String!,
      $clubId: String!,
      $teamStatus: Int!,
      $teamVisibility: Int!,
      $teamDescription: String!,
      $venueType: Int!,
      $teamType: Int!
    ) {
      createTeamForParentClub(
        teamInput: {
          user_postgre_metadata: {
            UserParentClubId: $userParentClubId
          }
          teamDetails: {
            activityCode: $activityCode
            venueKey: $venueKey
            ageGroup: $ageGroup
            teamName: $teamName
            shortName: $shortName
            clubId: $clubId
            teamStatus: $teamStatus
            teamVisibility: $teamVisibility
            teamDescription: $teamDescription
            venueType: $venueType
            team_type: $teamType
          }
        }
      ) {
        id
        created_at
        created_by
        updated_at
        is_active
        activity {
          ActivityCode
          ActivityName
        }
        venueKey
        venueType
        ageGroup
        teamName
        teamStatus
        teamVisibility
        teamDescription
        parentClub {
          FireBaseId
        }
      }
    }
  `,variables:{userParentClubId:e.user_postgre_metadata.UserParentClubId,activityCode:e.teamDetails.activityCode,venueKey:e.teamDetails.venueKey,ageGroup:e.teamDetails.ageGroup,teamName:e.teamDetails.teamName,shortName:e.teamDetails.shortName||"",clubId:e.teamDetails.clubId,teamStatus:e.teamDetails.teamStatus,teamVisibility:e.teamDetails.teamVisibility,teamDescription:e.teamDetails.teamDescription||"",venueType:e.teamDetails.venueType,teamType:e.teamDetails.team_type}};return this.http.post(this.apiUrl,r,this.httpOptions).pipe(n(t=>{if(t.errors)throw new Error(t.errors[0].message);return t.data.createTeamForParentClub}),i(this.handleError))}updateTeam(e){let r={query:`
    mutation modifyParentClubTeam(
      $ParentClubKey: String!,
      $MemberKey: String!,
      $AppType: Int!,
      $ActionType: Int!,
      $teamId: String!,
      $shortName: String!,
      $activityCode: String!,
      $venueKey: String!,
      $teamName: String!,
      $teamType: Int!,
      $ageGroup: String!,
      $teamStatus: Int!
    ) {
      modifyParentClubTeam(
        teamEditInput: {
          ParentClubKey: $ParentClubKey
          MemberKey: $MemberKey
          AppType: $AppType
          ActionType: $ActionType
          teamId: $teamId
          shortName: $shortName
          teamDetailsInput: {
            activityCode: $activityCode
            venueKey: $venueKey
            teamName: $teamName
            team_type: $teamType
            ageGroup: $ageGroup
            teamStatus: $teamStatus
          }
        }
      )
    }
  `,variables:{ParentClubKey:e.ParentClubKey,MemberKey:e.MemberKey,AppType:e.AppType,ActionType:e.ActionType,teamId:e.teamId,shortName:e.teamDetailsInput.shortName||"",activityCode:e.teamDetailsInput.activityCode,venueKey:e.teamDetailsInput.venueKey||"",teamName:e.teamDetailsInput.teamName,teamType:parseInt(e.teamDetailsInput.team_type?.toString()||"0",10),ageGroup:e.teamDetailsInput.ageGroup,teamStatus:parseInt(e.teamDetailsInput.teamStatus?.toString()||"0",10)}};return this.http.post(this.apiUrl,r,this.httpOptions).pipe(n(t=>{if(t.errors)throw new Error(t.errors[0].message);return t.data.modifyParentClubTeam}),i(this.handleError))}addPlayerToTeam(e){let r={query:`
  mutation addPlayerToTeam(
    $ParentClubKey: String!,
    $MemberKey: String!,
    $AppType: Int!,
    $ActionType: Int!,
    $teamId: String!,
    $members: [TeamMember!]!
  ) {
    addPlayerToTeam(
      addPlayer: {
        ParentClubKey: $ParentClubKey
        MemberKey: $MemberKey
        AppType: $AppType
        ActionType: $ActionType
        teamId: $teamId
        members: $members
      }
    )
  }
`,variables:{ParentClubKey:e.ParentClubKey,MemberKey:e.MemberKey,AppType:e.AppType,ActionType:e.ActionType,teamId:e.teamId,members:e.members}};return this.http.post(this.apiUrl,r,this.httpOptions).pipe(n(t=>{if(t.errors&&t.errors.length)throw new Error(t.errors[0].message);return t.data.addPlayerToTeam}),i(this.handleError))}removePlayerFromTeam(e){let r={query:`
      mutation removeTeamPlayer($memberShipIds: [String!]!) {
        removeTeamPlayer(
          playerDetails: {
            memberShipIds: $memberShipIds
          }
        )
      }
    `,variables:{memberShipIds:e.memberShipIds}};return this.http.post(this.apiUrl,r,this.httpOptions).pipe(n(t=>{if(t.errors)throw new Error(t.errors[0].message);return t.data.removeTeamPlayer}),i(this.handleError))}deleteTeam(e){let r={query:`
      mutation deleteParentClubTeam($teamEditInput: String!) {
        deleteParentClubTeam(teamEditInput: $teamEditInput)
      }
    `,variables:{teamEditInput:e}};return this.http.post(this.apiUrl,r,this.httpOptions).pipe(n(t=>{if(t.errors)throw new Error(t.errors[0].message);return t.data.deleteParentClubTeam}),i(this.handleError))}handleError(e){let a="An unknown error occurred";return e.error instanceof ErrorEvent?a=`Error: ${e.error.message}`:(a=`Error Code: ${e.status}
Message: ${e.message}`,e.error?.errors&&(a=e.error.errors[0]?.message||a)),d(()=>new Error(a))}getTeamsForParentClubV2(e){return this.http.post(m.getTeamsForParentClub,e,{headers:this.getHeaders()}).pipe(o(3e4),p(1),n(a=>{if(!a?.data)throw new Error("Invalid response: data is missing");return a.data}),i(this.handleError))}static \u0275fac=function(a){return new(a||u)(g(c))};static \u0275prov=y({token:u,factory:u.\u0275fac,providedIn:"root"})};export{C as a,v as b,P as c,_ as d};
